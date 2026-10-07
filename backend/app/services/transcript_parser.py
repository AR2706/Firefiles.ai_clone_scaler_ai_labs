"""Turn an uploaded or pasted transcript into a list of timed segments.

Three formats are supported:
  .txt   "Speaker: text" lines, with an optional leading [HH:MM:SS] timestamp
  .vtt   WebVTT captions, with speakers as "<v Name>" tags or "Name:" prefixes
  .json  a list of {"speaker", "start", "end", "text"} objects (seconds),
         or the same list under a top-level "segments" key
"""
import json
import re
from dataclasses import dataclass

# Average speaking pace, used to estimate timings when a transcript has none.
MS_PER_WORD = 400
MIN_SEGMENT_MS = 1500
UNKNOWN_SPEAKER = "Speaker"


class TranscriptParseError(ValueError):
    """Raised when the transcript text cannot be understood."""


@dataclass
class ParsedSegment:
    speaker: str
    start_ms: int | None
    end_ms: int | None
    text: str


_TIMESTAMP = r"(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?"
_TXT_LINE = re.compile(rf"^\s*(?:\[?{_TIMESTAMP}\]?\s*[-–]?\s*)?([^:\[\]]{{1,60}}?):\s+(.+)$")
_VTT_CUE = re.compile(rf"^{_TIMESTAMP}\s*-->\s*{_TIMESTAMP}")
_VTT_VOICE = re.compile(r"^<v\s+([^>]+)>(.*?)(?:</v>)?$")


def _to_ms(hours: str | None, minutes: str, seconds: str, fraction: str | None) -> int:
    millis = int((fraction or "0").ljust(3, "0"))
    return ((int(hours or 0) * 60 + int(minutes)) * 60 + int(seconds)) * 1000 + millis


def _estimate_ms(text: str) -> int:
    return max(MIN_SEGMENT_MS, len(text.split()) * MS_PER_WORD)


def _parse_txt(content: str) -> list[ParsedSegment]:
    segments: list[ParsedSegment] = []
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        match = _TXT_LINE.match(line)
        if match:
            hours, minutes, seconds, fraction, speaker, text = match.groups()
            start = _to_ms(hours, minutes, seconds, fraction) if minutes is not None else None
            segments.append(ParsedSegment(speaker.strip(), start, None, text.strip()))
        elif segments:
            # A line without a speaker continues the previous speaker's turn.
            segments[-1].text += " " + line
        else:
            segments.append(ParsedSegment(UNKNOWN_SPEAKER, None, None, line))
    return segments


def _parse_vtt(content: str) -> list[ParsedSegment]:
    segments: list[ParsedSegment] = []
    current: ParsedSegment | None = None
    for raw_line in content.splitlines():
        line = raw_line.strip()
        cue = _VTT_CUE.match(line)
        if cue:
            groups = cue.groups()
            current = ParsedSegment(UNKNOWN_SPEAKER, _to_ms(*groups[:4]), _to_ms(*groups[4:]), "")
            segments.append(current)
        elif not line:
            current = None
        elif current is not None:
            voice = _VTT_VOICE.match(line)
            prefixed = re.match(r"^([^:<>]{1,60}?):\s+(.+)$", line)
            if voice:
                current.speaker, line = voice.group(1).strip(), voice.group(2).strip()
            elif prefixed and not current.text:
                current.speaker, line = prefixed.group(1).strip(), prefixed.group(2).strip()
            current.text = f"{current.text} {line}".strip()
    return [segment for segment in segments if segment.text]


def _seconds_to_ms(value) -> int | None:
    return None if value is None else int(float(value) * 1000)


def _parse_json(content: str) -> list[ParsedSegment]:
    try:
        data = json.loads(content)
    except json.JSONDecodeError as error:
        raise TranscriptParseError(f"Invalid JSON: {error.msg}") from error
    if isinstance(data, dict):
        data = data.get("segments")
    if not isinstance(data, list):
        raise TranscriptParseError('JSON must be a list of segments or {"segments": [...]}.')

    segments = []
    for item in data:
        if not isinstance(item, dict) or not str(item.get("text", "")).strip():
            continue
        segments.append(
            ParsedSegment(
                speaker=str(item.get("speaker") or UNKNOWN_SPEAKER).strip(),
                start_ms=_seconds_to_ms(item.get("start")),
                end_ms=_seconds_to_ms(item.get("end")),
                text=str(item["text"]).strip(),
            )
        )
    return segments


def _fill_missing_times(segments: list[ParsedSegment]) -> None:
    """Give every segment a start and end, estimating from word count if needed."""
    cursor = 0
    for index, segment in enumerate(segments):
        if segment.start_ms is None or segment.start_ms < cursor:
            segment.start_ms = cursor
        if segment.end_ms is None or segment.end_ms <= segment.start_ms:
            next_start = segments[index + 1].start_ms if index + 1 < len(segments) else None
            if next_start is not None and next_start > segment.start_ms:
                segment.end_ms = next_start
            else:
                segment.end_ms = segment.start_ms + _estimate_ms(segment.text)
        cursor = segment.end_ms


def detect_format(filename: str | None, content: str) -> str:
    extension = (filename or "").rsplit(".", 1)[-1].lower()
    if extension in {"txt", "vtt", "json"}:
        return extension
    stripped = content.lstrip()
    if stripped.startswith("WEBVTT"):
        return "vtt"
    if stripped.startswith(("[", "{")) and stripped.rstrip().endswith(("]", "}")):
        try:
            json.loads(stripped)
            return "json"
        except json.JSONDecodeError:
            pass
    return "txt"


def parse_transcript(content: str, filename: str | None = None) -> list[ParsedSegment]:
    """Parse transcript text and return segments that all have start and end times."""
    parsers = {"txt": _parse_txt, "vtt": _parse_vtt, "json": _parse_json}
    segments = parsers[detect_format(filename, content)](content)
    if not segments:
        raise TranscriptParseError("No transcript lines were found.")
    _fill_missing_times(segments)
    return segments
