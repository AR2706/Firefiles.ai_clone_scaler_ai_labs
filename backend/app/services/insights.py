"""Smart filters and speaker statistics computed from a transcript.

Each filter is a simple rule over a line's text. The rules are deliberately
plain, so it is easy to see why a line was picked.
"""
import re

from app.models import TranscriptSegment
from app.services.summarizer import ACTION_PATTERN

_NUMBER_WORDS = (
    "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|"
    "sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|"
    "hundred|thousand|million|billion|half|percent"
)
_DATE_WORDS = (
    "monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|yesterday|tonight|"
    "january|february|march|april|june|july|august|september|october|november|december|"
    "next week|last week|this week|next month|last month|end of day|quarter|q[1-4]"
)

FILTERS = [
    ("tasks", "Tasks", ACTION_PATTERN),
    ("questions", "Questions", re.compile(r"\?")),
    (
        "dates",
        "Dates and times",
        re.compile(rf"\b({_DATE_WORDS})\b|\b\d{{1,2}}:\d{{2}}\b|\b\d{{1,2}}\s?(am|pm)\b", re.IGNORECASE),
    ),
    ("metrics", "Metrics", re.compile(rf"\d|\b({_NUMBER_WORDS})\b", re.IGNORECASE)),
]


def build_insights(segments: list[TranscriptSegment]) -> dict:
    filters = []
    for key, label, pattern in FILTERS:
        ids = [segment.id for segment in segments if pattern.search(segment.text)]
        filters.append({"key": key, "label": label, "count": len(ids), "segment_ids": ids})

    talk_ms: dict[str, int] = {}
    words: dict[str, int] = {}
    for segment in segments:
        name = segment.speaker_name
        talk_ms[name] = talk_ms.get(name, 0) + (segment.end_ms - segment.start_ms)
        words[name] = words.get(name, 0) + len(segment.text.split())

    total = sum(talk_ms.values()) or 1
    speakers = [
        {
            "name": name,
            "talk_ms": duration,
            "percent": round(duration * 100 / total),
            "word_count": words[name],
        }
        for name, duration in sorted(talk_ms.items(), key=lambda pair: pair[1], reverse=True)
    ]
    return {"filters": filters, "speakers": speakers}
