import pytest

from app.services.transcript_parser import TranscriptParseError, parse_transcript


def test_plain_text_estimates_timings():
    segments = parse_transcript("Asha: Hello everyone, welcome.\nBen: Thanks for having me.")
    assert [s.speaker for s in segments] == ["Asha", "Ben"]
    assert segments[0].start_ms == 0
    assert segments[1].start_ms == segments[0].end_ms


def test_plain_text_with_timestamps():
    segments = parse_transcript("[00:00:05] Asha: First point.\n[00:01:10] Ben: Second point.")
    assert segments[0].start_ms == 5_000
    assert segments[0].end_ms == 70_000
    assert segments[1].start_ms == 70_000


def test_line_without_speaker_continues_previous_turn():
    segments = parse_transcript("Asha: First part\nand the rest of it.")
    assert len(segments) == 1
    assert segments[0].text == "First part and the rest of it."


def test_vtt_with_voice_tags():
    vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:04.500\n<v Asha>Hello there.</v>\n\n00:00:05.000 --> 00:00:07.000\nBen: Hi."
    segments = parse_transcript(vtt, "call.vtt")
    assert (segments[0].speaker, segments[0].start_ms, segments[0].end_ms) == ("Asha", 1000, 4500)
    assert (segments[1].speaker, segments[1].text) == ("Ben", "Hi.")


def test_json_segments_in_seconds():
    content = '[{"speaker": "Asha", "start": 1.5, "end": 3, "text": "Hello"}]'
    segments = parse_transcript(content, "call.json")
    assert (segments[0].start_ms, segments[0].end_ms) == (1500, 3000)


def test_format_is_detected_without_a_filename():
    assert parse_transcript('{"segments": [{"speaker": "A", "text": "Hi"}]}')[0].speaker == "A"


def test_empty_transcript_is_rejected():
    with pytest.raises(TranscriptParseError):
        parse_transcript("   \n  ")
