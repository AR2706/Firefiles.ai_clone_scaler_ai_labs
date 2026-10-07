"""Generate meeting notes (summary, chapters, action items) from a transcript.

`SummaryProvider` is the seam for swapping implementations. The default
`ExtractiveSummaryProvider` needs no API key: it scores sentences by how many
of the meeting's frequent words they contain and picks the best ones. An
LLM-backed provider can implement the same method and be returned from
`get_summary_provider` without touching any caller.
"""
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Protocol

from app.models import ActionItem, Chapter, Meeting, Summary, TranscriptSegment

STOPWORDS = frozenset(
    """a about above after again all also am an and any are as at be because been before being
    below between both but by can could did do does doing don down during each few for from
    further get go going got had has have having he her here hers him his how i if in into is it
    its just know let like ll make me more most my no nor not now of off ok okay on once one only
    or other our out over own really right re s same say she should so some such t than thanks
    thank that the their them then there these they thing things think this those through to too
    under until up us ve very want was we well were what when where which while who why will
    with would yeah yes you your""".split()
)

# Phrases that usually introduce a commitment or a request.
ACTION_PATTERN = re.compile(
    r"\b(i'll|i will|i can take|we'll|we need to|we should|let's|can you|could you|"
    r"please|action item|follow up|make sure|i'm going to)\b",
    re.IGNORECASE,
)
FIRST_PERSON = re.compile(r"\b(i'll|i will|i can take|i'm going to)\b", re.IGNORECASE)
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")
_WORD = re.compile(r"[a-zA-Z][a-zA-Z'-]+")

MAX_KEYWORDS = 8
# How many key points and overview sentences each level of detail keeps.
STYLES = {
    "condensed": {"key_points": 3, "overview_sentences": 1},
    "standard": {"key_points": 5, "overview_sentences": 2},
    "expanded": {"key_points": 8, "overview_sentences": 3},
}
MAX_ACTION_ITEMS = 8
SEGMENTS_PER_CHAPTER = 8


@dataclass
class ChapterDraft:
    title: str
    summary: str
    start_ms: int


@dataclass
class ActionDraft:
    text: str
    assignee: str | None
    source_start_ms: int


@dataclass
class NotesResult:
    overview: str
    key_points: list[str]
    keywords: list[str]
    chapters: list[ChapterDraft] = field(default_factory=list)
    action_items: list[ActionDraft] = field(default_factory=list)
    generated_by: str = "extractive"


class SummaryProvider(Protocol):
    def summarize(self, segments: list[TranscriptSegment], style: str = "standard") -> NotesResult: ...


def _words(text: str) -> list[str]:
    return [w for w in (m.lower() for m in _WORD.findall(text)) if w not in STOPWORDS and len(w) > 2]


def _sentences(segment: TranscriptSegment) -> list[str]:
    return [s.strip() for s in _SENTENCE_END.split(segment.text) if len(s.split()) >= 4]


def _join_names(names: list[str]) -> str:
    if len(names) <= 1:
        return "".join(names)
    return ", ".join(names[:-1]) + " and " + names[-1]


class ExtractiveSummaryProvider:
    """Keyword-frequency summarizer. Deterministic and offline."""

    def summarize(self, segments: list[TranscriptSegment], style: str = "standard") -> NotesResult:
        limits = STYLES.get(style, STYLES["standard"])
        frequency = Counter(word for segment in segments for word in _words(segment.text))
        keywords = [word for word, _ in frequency.most_common(MAX_KEYWORDS)]

        def score(sentence: str) -> float:
            words = _words(sentence)
            # Dividing by length stops long sentences from always winning.
            return sum(frequency[w] for w in words) / (len(words) + 5) if words else 0.0

        scored = [
            (score(sentence), position, segment.speaker_name, sentence)
            for position, segment in enumerate(segments)
            for sentence in _sentences(segment)
        ]
        best = sorted(sorted(scored, reverse=True)[: limits["key_points"]], key=lambda row: row[1])
        key_points = [f"{speaker}: {sentence}" for _, _, speaker, sentence in best]

        speakers = list(dict.fromkeys(segment.speaker_name for segment in segments))
        topics = _join_names(keywords[:4]) or "several topics"
        overview = f"{_join_names(speakers)} discussed {topics}."
        if best:
            top = sorted(best, reverse=True)[: limits["overview_sentences"]]
            overview += " " + " ".join(row[3] for row in sorted(top, key=lambda row: row[1]))

        return NotesResult(
            overview=overview,
            key_points=key_points,
            keywords=keywords,
            chapters=self._chapters(segments, score),
            action_items=self._action_items(segments),
        )

    @staticmethod
    def _chapters(segments: list[TranscriptSegment], score) -> list[ChapterDraft]:
        chapters = []
        for start in range(0, len(segments), SEGMENTS_PER_CHAPTER):
            chunk = segments[start : start + SEGMENTS_PER_CHAPTER]
            top = [w for w, _ in Counter(w for s in chunk for w in _words(s.text)).most_common(3)]
            sentences = [sentence for segment in chunk for sentence in _sentences(segment)]
            chapters.append(
                ChapterDraft(
                    title=", ".join(word.capitalize() for word in top) or "Discussion",
                    summary=max(sentences, key=score) if sentences else chunk[0].text,
                    start_ms=chunk[0].start_ms,
                )
            )
        return chapters

    @staticmethod
    def _action_items(segments: list[TranscriptSegment]) -> list[ActionDraft]:
        items = []
        for segment in segments:
            for sentence in _sentences(segment):
                if not ACTION_PATTERN.search(sentence) or sentence.endswith("?"):
                    continue
                # "I'll ..." is owned by whoever said it; other tasks start unassigned.
                assignee = segment.speaker_name if FIRST_PERSON.search(sentence) else None
                items.append(ActionDraft(sentence, assignee, segment.start_ms))
        return items[:MAX_ACTION_ITEMS]


import os
import json
import httpx
import logging

logger = logging.getLogger(__name__)

LLM_PROMPT = """You are an AI meeting assistant. Read the following transcript and extract the meeting notes.
Output ONLY valid JSON matching this schema exactly:
{
  "overview": "A 1-2 sentence overview of the meeting.",
  "key_points": ["Key point 1", "Key point 2"],
  "keywords": ["keyword1", "keyword2"],
  "chapters": [{"title": "Chapter 1", "summary": "What happened", "start_ms": 0}],
  "action_items": [{"text": "Action item description", "assignee": "Person Name or null", "source_start_ms": 0}]
}
Transcript:
"""

class MultiLLMFallbackProvider:
    def __init__(self):
        self.fallback = ExtractiveSummaryProvider()

    def summarize(self, segments: list[TranscriptSegment], style: str = "standard") -> NotesResult:
        text = "\n".join(f"[{s.start_ms}] {s.speaker_name}: {s.text}" for s in segments)
        prompt = LLM_PROMPT + text
        
        # 1. Try Mistral
        mistral_key = os.getenv("MISTRAL_API_KEY")
        if mistral_key:
            try:
                res = self._call_openai_compat("https://api.mistral.ai/v1/chat/completions", mistral_key, "mistral-small-latest", prompt)
                return self._parse_to_result(res, "Mistral LLM")
            except Exception as e:
                logger.warning(f"Mistral failed: {e}")

        # 2. Try Groq
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                res = self._call_openai_compat("https://api.groq.com/openai/v1/chat/completions", groq_key, "llama3-8b-8192", prompt)
                return self._parse_to_result(res, "Groq LLM")
            except Exception as e:
                logger.warning(f"Groq failed: {e}")

        # 3. Try Gemini
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            try:
                res = self._call_gemini(gemini_key, prompt)
                return self._parse_to_result(res, "Gemini LLM")
            except Exception as e:
                logger.warning(f"Gemini failed: {e}")

        # 4. Fallback to Extractive
        logger.info("All LLMs failed or no keys provided, falling back to extractive.")
        return self.fallback.summarize(segments, style)

    def _call_openai_compat(self, url: str, key: str, model: str, prompt: str) -> str:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                url,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    def _call_gemini(self, key: str, prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"}
                }
            )
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    def _parse_to_result(self, json_str: str, source: str) -> NotesResult:
        data = json.loads(json_str)
        return NotesResult(
            overview=data.get("overview", ""),
            key_points=data.get("key_points", []),
            keywords=data.get("keywords", [])[:8],
            chapters=[
                ChapterDraft(title=c.get("title",""), summary=c.get("summary",""), start_ms=c.get("start_ms",0))
                for c in data.get("chapters", [])
            ],
            action_items=[
                ActionDraft(text=a.get("text",""), assignee=a.get("assignee"), source_start_ms=a.get("source_start_ms",0))
                for a in data.get("action_items", [])
            ],
            generated_by=source
        )

def get_summary_provider() -> SummaryProvider:
    return MultiLLMFallbackProvider()



def generate_notes(
    meeting: Meeting, provider: SummaryProvider | None = None, style: str = "standard"
) -> None:
    """Write a summary and chapters onto the meeting, replacing any existing ones.

    Action items are only generated when the meeting has none, so regenerating
    notes never throws away tasks a user has added, edited or completed.
    """
    if not meeting.segments:
        return
    notes = (provider or get_summary_provider()).summarize(list(meeting.segments), style)

    if meeting.summary is None:
        meeting.summary = Summary()
    meeting.summary.overview = notes.overview
    meeting.summary.key_points = notes.key_points
    meeting.summary.keywords = notes.keywords
    meeting.summary.generated_by = notes.generated_by
    meeting.summary.style = style
    meeting.summary.rating = None  # A rating belongs to the text it was given for.

    meeting.chapters = [
        Chapter(title=c.title, summary=c.summary, start_ms=c.start_ms) for c in notes.chapters
    ]
    if not meeting.action_items:
        meeting.action_items = [
            ActionItem(text=a.text, assignee=a.assignee, source_start_ms=a.source_start_ms)
            for a in notes.action_items
        ]
