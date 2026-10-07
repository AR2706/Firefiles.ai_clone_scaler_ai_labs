"""Sample meetings loaded into an empty database so the app is usable at once.

Each meeting has a transcript in the same "Speaker: text" form the upload
parser accepts, plus hand-written notes. `chapters` and `action_items` point
at a transcript line number so their timestamps can be looked up.
"""

MEETINGS = [
    {
        "title": "Q4 Product Roadmap Planning",
        "days_ago": 1,
        "hour": 10,
        "tags": ["Product", "Planning"],
        "transcript": """
Priya Nair: Thanks for joining, everyone. The goal today is to lock the three roadmap themes for Q4 so engineering can start sizing work next week.
Marcus Lee: Before we start, I want to flag that the platform team is down two engineers until November, so we have less capacity than last quarter.
Priya Nair: Understood. That makes prioritising even more important. I have three candidate themes: self-serve onboarding, the reporting dashboard, and the mobile app refresh.
Sofia Alvarez: From the design side, onboarding has the most research behind it. We ran twelve user interviews and nine people got stuck connecting their calendar.
Alex Morgan: That matches what support is seeing. Calendar connection is the top ticket category for new accounts, about thirty percent of all first-week tickets.
Priya Nair: So onboarding is the first theme. Does anyone disagree with that?
Marcus Lee: No, I agree. The work is mostly frontend plus one new endpoint, so it fits our reduced capacity.
Priya Nair: Good. Second is the reporting dashboard. Enterprise customers keep asking for team-level usage reports.
Alex Morgan: Two of our largest renewals in December depend on it. Northwind told us directly that they need usage reports before they sign again.
Marcus Lee: The reporting dashboard needs a new aggregation job. I estimate six weeks with two engineers, and it carries some risk because the events table is very large.
Sofia Alvarez: I can have dashboard wireframes ready by the end of next week if we agree on the five core metrics first.
Priya Nair: Let's agree on those metrics offline. I'll send a draft list of the five metrics by Wednesday.
Marcus Lee: Then the question is whether we can also fit the mobile app refresh. Honestly, I do not think we can do all three with this team.
Priya Nair: What would you cut?
Marcus Lee: I would move the mobile refresh to Q1. It has no revenue deadline, and the current app is stable.
Sofia Alvarez: I am a little disappointed, because the mobile designs are finished, but I agree it is the right call. The designs will still be valid in January.
Alex Morgan: Could we ship one small mobile improvement, like fixing the login screen, so mobile users see some progress?
Marcus Lee: A login fix is about three days of work. We can fit that in as a stretch goal.
Priya Nair: Great. So the decision is: onboarding first, reporting dashboard second, mobile refresh moves to Q1 with a login fix as a stretch goal.
Marcus Lee: I'll put together engineering estimates for onboarding and the dashboard by next Friday.
Sofia Alvarez: And I'll share the onboarding prototype with the team on Monday so we can test it with five customers.
Alex Morgan: I will let the Northwind account team know that usage reports are planned for this quarter.
Priya Nair: Perfect. Thanks, everyone. We will review progress at the next roadmap check-in in two weeks.
""",
        "overview": "The team agreed on the Q4 roadmap. Self-serve onboarding is the first priority because calendar connection causes about thirty percent of first-week support tickets. The reporting dashboard is second, driven by two December enterprise renewals. The mobile app refresh moves to Q1 because the platform team is short two engineers until November.",
        "key_points": [
            "Self-serve onboarding is the top Q4 theme; nine of twelve interviewed users got stuck connecting their calendar.",
            "The reporting dashboard is second and is tied to two large December renewals, including Northwind.",
            "The dashboard needs a new aggregation job, estimated at six weeks for two engineers.",
            "The mobile app refresh moves to Q1, with a login screen fix as a stretch goal.",
            "Engineering capacity is reduced by two people until November.",
        ],
        "keywords": ["roadmap", "onboarding", "reporting dashboard", "mobile", "capacity", "renewals"],
        "chapters": [
            (0, "Goals and capacity", "Priya sets the goal of choosing three themes; Marcus flags reduced engineering capacity."),
            (3, "Onboarding as the first theme", "Research and support data both point to calendar connection as the biggest problem."),
            (7, "Reporting dashboard", "Enterprise renewals depend on team usage reports; engineering estimates six weeks."),
            (12, "Mobile refresh moved to Q1", "The team agrees to defer mobile and keep a small login fix as a stretch goal."),
            (18, "Decisions and next steps", "Priya confirms the plan and owners take their follow-ups."),
        ],
        "action_items": [
            (11, "Send a draft list of the five core dashboard metrics by Wednesday", "Priya Nair", False),
            (19, "Prepare engineering estimates for onboarding and the dashboard by next Friday", "Marcus Lee", False),
            (20, "Share the onboarding prototype on Monday and test it with five customers", "Sofia Alvarez", True),
            (21, "Tell the Northwind account team that usage reports are planned for Q4", "Alex Morgan", False),
        ],
    },
    {
        "title": "Weekly Engineering Standup",
        "days_ago": 2,
        "hour": 9,
        "tags": ["Engineering"],
        "transcript": """
Marcus Lee: Morning, all. Quick round of updates, then blockers. Jordan, do you want to start?
Jordan Kim: Sure. Yesterday I finished the pagination work on the meetings API. It now returns twenty results per page with a total count, and the tests are passing.
Marcus Lee: Nice. Is that merged?
Jordan Kim: It is in review. Tara, could you take a look at the pull request today? It is about two hundred lines.
Tara Singh: Yes, I'll review it before lunch.
Jordan Kim: Thanks. Today I am starting on the search endpoint. My plan is to use full-text search in the database rather than adding a separate search service.
Marcus Lee: That makes sense at our current size. Keep the query logic in one module so we can swap it out later.
Tara Singh: My update: the deployment pipeline is fixed. The flaky test was caused by two tests sharing one database file, so I gave each test its own temporary database.
Marcus Lee: Great, that flaky test cost us hours last week. How long does the pipeline take now?
Tara Singh: About four minutes, down from nine. I also added a cache for the dependency install step.
Alex Morgan: From my side, I am halfway through the transcript upload form. File upload works, but I still need to show a useful error when the file format is wrong.
Marcus Lee: What happens today if someone uploads a broken file?
Alex Morgan: The API returns a 422 with a message, but the form only shows a generic error. I'll connect the real message to the toast notification today.
Tara Singh: One request: please also limit the file size on the client. We limit it to two megabytes on the server, and it is better to tell people before they upload.
Alex Morgan: Good point, I will add that check.
Marcus Lee: Any blockers?
Jordan Kim: One. I need a decision on whether search should match partial words. For example, should typing "invo" find "invoice"?
Marcus Lee: Yes, match prefixes on the last word so results appear while people type. Everything before the last word should be an exact match.
Jordan Kim: Perfect, that unblocks me.
Tara Singh: No blockers from me. I am going to start on the rate limiter this afternoon.
Marcus Lee: Good. Please use a token bucket so short bursts from page loads are allowed.
Tara Singh: Will do. I'll write up the limits in the README so the frontend team knows what to expect.
Marcus Lee: Thanks, everyone. Demo is on Friday at three, so let's make sure search and upload are both ready by Thursday evening.
""",
        "overview": "The engineering team shared progress on the meetings API, the deployment pipeline and the transcript upload form. Pagination is in review, the pipeline now runs in four minutes instead of nine, and upload works apart from error messages. The team decided search will match prefixes on the last word, and the rate limiter will use a token bucket. Search and upload must be ready by Thursday evening for Friday's demo.",
        "key_points": [
            "Pagination on the meetings API is finished and in review.",
            "The flaky pipeline test was fixed by giving each test its own database; the pipeline is down from nine minutes to four.",
            "Search will use database full-text search with prefix matching on the last word.",
            "The upload form needs to show the API's real error message and check file size on the client.",
            "The rate limiter will use a token bucket; search and upload are due Thursday evening.",
        ],
        "keywords": ["pagination", "search", "pipeline", "upload", "rate limiter", "demo"],
        "chapters": [
            (0, "Meetings API and search plan", "Jordan finished pagination and will build search on database full-text search."),
            (7, "Deployment pipeline", "Tara fixed the flaky test and cut the pipeline time to four minutes."),
            (10, "Transcript upload form", "Alex has upload working and will add clearer errors and a file size check."),
            (15, "Blockers and decisions", "Search matches prefixes on the last word; the rate limiter uses a token bucket."),
        ],
        "action_items": [
            (4, "Review Jordan's pagination pull request before lunch", "Tara Singh", True),
            (12, "Show the API's error message in the upload toast notification", "Alex Morgan", False),
            (14, "Add a two megabyte file size check to the upload form", "Alex Morgan", False),
            (21, "Document the rate limits in the README", "Tara Singh", False),
            (22, "Have search and upload ready by Thursday evening for the Friday demo", None, False),
        ],
    },
    {
        "title": "Customer Discovery Call: Northwind Logistics",
        "days_ago": 4,
        "hour": 15,
        "tags": ["Customer", "Sales"],
        "transcript": """
Alex Morgan: Elena, thank you for making the time. I would love to understand how your team runs meetings today and where the notes end up.
Elena Rossi: Happy to. We are about forty people in operations, and we have daily carrier calls plus a weekly planning meeting. Right now one person takes notes by hand in a shared document.
Alex Morgan: How well does that work?
Elena Rossi: Honestly, not well. The note taker cannot really participate, and the notes are usually posted a day late. By then people have forgotten what they agreed to.
Priya Nair: When the notes do arrive, what do people look for first?
Elena Rossi: Action items. Nobody reads the full notes. They search for their own name to see what they are supposed to do.
Priya Nair: That is helpful. So a list of tasks grouped by person would be more useful to you than a long summary?
Elena Rossi: Much more useful. A short summary at the top is fine, but the tasks are what matter.
Alex Morgan: How do you follow up on those tasks today?
Elena Rossi: We do not, really. My manager asks about them in the next meeting, and about half are done. There is no tracking.
Alex Morgan: If the tasks could be checked off and you could see what is still open from last week, would that change anything?
Elena Rossi: Yes. That would save the first ten minutes of every planning meeting, because we spend that time asking who did what.
Priya Nair: Do you ever need to go back and find something that was said in an older meeting?
Elena Rossi: All the time. Carriers dispute what rate they agreed to, and I have to dig through documents to find the right week. Searching across all meetings would be a big deal for us.
Alex Morgan: What tools would this need to connect with?
Elena Rossi: We live in Google Meet and Google Calendar. If I had to invite something manually to every call, people would forget. It needs to join on its own.
Priya Nair: Understood. Are there any concerns about recording carrier calls?
Elena Rossi: Yes, legal will ask. We need the recorder to announce itself, and we need to be able to delete a recording if a carrier objects.
Alex Morgan: Both of those are supported. I can send you our security overview and the data deletion policy after this call.
Elena Rossi: Please do. Our legal review usually takes two weeks, so the sooner the better.
Priya Nair: Last question. If you could have only one thing from us next month, what would it be?
Elena Rossi: Usage reports for my manager. She wants to see which teams actually use the tool before she approves the renewal.
Alex Morgan: That is very clear. I'll send the security documents today and set up a follow-up call for next Tuesday to walk through the reporting plans.
Elena Rossi: Sounds good. Thank you both, this was useful.
""",
        "overview": "Elena Rossi from Northwind Logistics described how her forty-person operations team handles meeting notes. Manual notes arrive a day late and people only read their own action items, which are not tracked. Northwind needs tasks grouped by person, search across past meetings for carrier rate disputes, automatic joining for Google Meet, and usage reports before their renewal. Legal requires a recording announcement and the ability to delete recordings.",
        "key_points": [
            "Notes are taken by hand, arrive a day late, and the note taker cannot participate.",
            "People read only their own action items; about half are completed and nothing is tracked.",
            "Searching across all meetings matters because carriers dispute agreed rates.",
            "The recorder must join Google Meet automatically and announce itself; recordings must be deletable.",
            "Usage reports are the single most important request before the renewal.",
        ],
        "keywords": ["action items", "search", "Google Meet", "legal review", "usage reports", "renewal"],
        "chapters": [
            (0, "How meetings run today", "One person takes notes by hand and posts them a day late."),
            (4, "Action items over summaries", "People look for their own tasks; there is no tracking between meetings."),
            (12, "Finding past decisions", "Carrier rate disputes make search across meetings valuable."),
            (14, "Integrations and legal needs", "Automatic joining on Google Meet, recording announcement, and deletion."),
            (20, "Top request and next steps", "Usage reports for the renewal; Alex will send security documents."),
        ],
        "action_items": [
            (18, "Send the security overview and data deletion policy to Elena", "Alex Morgan", True),
            (22, "Set up a follow-up call next Tuesday to walk through reporting plans", "Alex Morgan", False),
            (6, "Explore grouping action items by person in the summary view", "Priya Nair", False),
        ],
    },
    {
        "title": "Design Review: Onboarding Flow",
        "days_ago": 6,
        "hour": 14,
        "tags": ["Design", "Product"],
        "transcript": """
Sofia Alvarez: I am going to share the new onboarding prototype. It is four screens: sign in, connect calendar, choose which meetings to record, and a finished state.
Priya Nair: Four screens is already better than the seven we have today.
Sofia Alvarez: Exactly. The biggest change is on the calendar screen. Instead of a long explanation, there is one button and a short line that says what we will and will not access.
Jordan Kim: What happens if the user denies calendar permission?
Sofia Alvarez: Good question. They land on a screen that explains they can still upload a transcript by hand, with a button to try connecting again.
Jordan Kim: That is doable. We already get a clear error from the calendar provider when permission is denied, so I can route on that.
Priya Nair: On the third screen, the default is to record all meetings. Is that the right default? Some people may be surprised by a recorder in a one-on-one.
Sofia Alvarez: I tested three options with five users. Most preferred recording only meetings they organise, so I think that should be the default.
Priya Nair: I agree. Let's make "meetings I organise" the default and keep "all meetings" as an option.
Jordan Kim: From the engineering side that is a simple filter on the organiser field, so there is no extra cost.
Sofia Alvarez: The finished screen shows a sample meeting so the library is not empty. People can click through a real transcript and summary immediately.
Priya Nair: I love that. An empty library was the main reason people left in the first session.
Jordan Kim: We should mark the sample clearly, so nobody thinks we recorded a meeting they did not have.
Sofia Alvarez: Agreed. I'll add a "Sample" label to the card and a way to dismiss it.
Priya Nair: What about the progress indicator at the top? It shows four dots, but the last screen is not really a step.
Sofia Alvarez: Fair point. I can change it to three steps and treat the finished state as a confirmation.
Jordan Kim: One accessibility note: the grey helper text under the button is hard to read. The contrast looks too low.
Sofia Alvarez: You are right, I will darken it and check all the text against the contrast guidelines.
Priya Nair: How long would this take to build, Jordan?
Jordan Kim: About two weeks for the four screens, plus three days for the denied-permission path and tests.
Priya Nair: Good. Let's aim to start the build next Monday. Sofia, can you finalise the designs by Friday?
Sofia Alvarez: Yes. I'll update the prototype with today's changes and share the final version on Friday morning.
Jordan Kim: And I'll write a short technical plan for the calendar permission handling before we start.
""",
        "overview": "Sofia presented a four-screen onboarding prototype that replaces the current seven screens. The team agreed that the default should be to record only meetings the user organises, that a labelled sample meeting should fill the empty library, and that the progress indicator should show three steps. Jordan estimated about two weeks plus three days to build, starting next Monday.",
        "key_points": [
            "Onboarding drops from seven screens to four, with a single button for calendar connection.",
            "If calendar permission is denied, users see a manual upload option and a retry button.",
            "The default changes to recording only meetings the user organises.",
            "A clearly labelled sample meeting fills the library after onboarding.",
            "The build takes about two weeks plus three days and starts next Monday.",
        ],
        "keywords": ["onboarding", "prototype", "calendar permission", "default", "sample meeting", "accessibility"],
        "chapters": [
            (0, "Prototype walkthrough", "Four screens replace seven; the calendar step is one button."),
            (3, "Denied calendar permission", "A fallback screen offers manual upload and a retry."),
            (6, "Recording default", "User testing supports recording only meetings the user organises."),
            (10, "Sample meeting and progress indicator", "A labelled sample fills the library; the indicator drops to three steps."),
            (16, "Accessibility and build plan", "Helper text contrast is fixed; the build starts next Monday."),
        ],
        "action_items": [
            (13, "Add a \"Sample\" label and a dismiss option to the sample meeting card", "Sofia Alvarez", False),
            (17, "Darken the helper text and check all text against contrast guidelines", "Sofia Alvarez", False),
            (21, "Share the final prototype on Friday morning", "Sofia Alvarez", False),
            (22, "Write a technical plan for calendar permission handling", "Jordan Kim", True),
        ],
    },
    {
        "title": "Sales Pipeline Review",
        "days_ago": 9,
        "hour": 11,
        "tags": ["Sales"],
        "transcript": """
Daniel Okafor: Let's go through the pipeline for this month. Hannah, can you start with the deals that are closest to closing?
Hannah Brooks: Yes. We have three deals in final negotiation. The largest is Brightline Health at eighty seats. They have verbally agreed, and the contract is with their procurement team.
Daniel Okafor: What is the risk on Brightline?
Hannah Brooks: Procurement wants a security questionnaire completed. It is long, about two hundred questions, and they need it back by the fifteenth.
Alex Morgan: I can help with that. We answered a similar questionnaire last quarter, so I can reuse most of it.
Daniel Okafor: Good. Please treat that as the top priority this week. What is the second deal?
Hannah Brooks: Cedar Analytics, thirty seats. They are comparing us with one competitor, and the deciding factor is the quality of the summaries.
Daniel Okafor: Have they run a trial?
Hannah Brooks: They are in the second week of a trial. Usage is strong: eleven of fifteen trial users recorded at least three meetings.
Alex Morgan: That is a good sign. I can pull a usage report for them so the champion has numbers to show her manager.
Hannah Brooks: That would help. She asked for exactly that yesterday.
Daniel Okafor: And the third?
Hannah Brooks: Orbit Freight, twenty seats. This one has slowed down. Their main contact went on leave, and nobody else has taken over.
Daniel Okafor: How long has it been quiet?
Hannah Brooks: Two weeks. I have sent two emails without a reply.
Daniel Okafor: Let's find a second contact. Check who else attended the demo and reach out to the most senior person.
Hannah Brooks: I'll do that today. I think their operations director was on the demo call.
Daniel Okafor: Good. Now, looking at the top of the pipeline, new leads are down fifteen percent compared with last month. Any idea why?
Alex Morgan: The webinar we normally run was cancelled last month. That usually brings in about forty leads on its own.
Daniel Okafor: Then we should bring the webinar back. Can we schedule one in the next three weeks?
Alex Morgan: Yes. I'll confirm a date with marketing and propose a topic by Thursday.
Daniel Okafor: Great. To summarise: the Brightline questionnaire is the priority, Cedar gets a usage report, Orbit needs a second contact, and the webinar comes back.
Hannah Brooks: One more thing: I would like to update the forecast. With Brightline likely to close, we are at about ninety percent of the monthly target.
Daniel Okafor: Good news. Please send the updated forecast to the leadership channel by end of day.
""",
        "overview": "The sales team reviewed three deals in final negotiation. Brightline Health (eighty seats) needs a two-hundred-question security questionnaire by the fifteenth. Cedar Analytics (thirty seats) is in a strong trial and will receive a usage report. Orbit Freight (twenty seats) has stalled and needs a second contact. New leads are down fifteen percent because last month's webinar was cancelled, so it will be rescheduled.",
        "key_points": [
            "Brightline Health has verbally agreed to eighty seats; the security questionnaire is due on the fifteenth.",
            "Cedar Analytics is comparing one competitor; eleven of fifteen trial users recorded at least three meetings.",
            "Orbit Freight has been quiet for two weeks since the main contact went on leave.",
            "New leads are down fifteen percent after the monthly webinar was cancelled.",
            "With Brightline, the team is at about ninety percent of the monthly target.",
        ],
        "keywords": ["pipeline", "Brightline", "security questionnaire", "trial", "webinar", "forecast"],
        "chapters": [
            (0, "Brightline Health", "Eighty seats agreed verbally; procurement needs a security questionnaire."),
            (6, "Cedar Analytics", "A strong trial; summary quality is the deciding factor."),
            (11, "Orbit Freight", "The deal stalled when the main contact went on leave."),
            (17, "Lead volume and webinar", "Leads fell fifteen percent; the webinar will return."),
            (21, "Summary and forecast", "Priorities are confirmed and the forecast is updated."),
        ],
        "action_items": [
            (4, "Complete the Brightline security questionnaire before the fifteenth", "Alex Morgan", False),
            (9, "Pull a trial usage report for the Cedar Analytics champion", "Alex Morgan", True),
            (16, "Find and contact a second person at Orbit Freight", "Hannah Brooks", True),
            (20, "Confirm a webinar date with marketing and propose a topic by Thursday", "Alex Morgan", False),
            (23, "Send the updated forecast to the leadership channel by end of day", "Hannah Brooks", True),
        ],
    },
    {
        "title": "Incident Postmortem: Checkout Outage",
        "days_ago": 13,
        "hour": 16,
        "tags": ["Engineering", "Incident"],
        "transcript": """
Tara Singh: This is a blameless review of Tuesday's checkout outage. The goal is to understand what happened and what we change, not who made a mistake.
Marcus Lee: Thanks, Tara. Can you walk us through the timeline first?
Tara Singh: Yes. At 2:04 in the afternoon we deployed a change that added a new index to the orders table. At 2:06 checkout requests started timing out.
Jordan Kim: The index migration took a lock on the whole table. While it ran, every write to the orders table had to wait.
Tara Singh: Correct. The first alert fired at 2:09, three minutes after the errors began. I was on call and acknowledged it at 2:11.
Priya Nair: How long were customers affected in total?
Tara Singh: Twenty-three minutes. Checkout was fully restored at 2:29, after we cancelled the migration and restarted the application servers.
Priya Nair: And how many orders failed?
Tara Singh: About four hundred and ten checkout attempts failed. We estimate that roughly half of those customers came back and completed their order later.
Marcus Lee: Why did the migration lock the table? We have added indexes before without any trouble.
Jordan Kim: Earlier indexes were built concurrently. This migration was written by hand and left out the concurrent option. In the test environment the table is tiny, so it finished instantly and nobody noticed.
Marcus Lee: So the review did not catch it, and the test environment could not show the problem.
Jordan Kim: Right. There is nothing in our process that checks migrations against a production-sized table.
Tara Singh: The second problem was detection. Three minutes is too slow for checkout. The alert waits for five failed health checks before it fires.
Marcus Lee: What would a better alert look like?
Tara Singh: An alert on the checkout error rate itself. If more than five percent of requests fail for one minute, page the on-call engineer.
Priya Nair: From the customer side, the status page was not updated until 2:25. Support had no information to give people for most of the outage.
Tara Singh: That is fair. Updating the status page was not part of the on-call checklist. It should be the second step after acknowledging an alert.
Marcus Lee: Let's turn these into actions. First, a check in the pipeline that rejects any index migration without the concurrent option.
Jordan Kim: I'll add that lint rule this week. It is a small script.
Tara Singh: I'll create the error-rate alert for checkout and lower the detection time to one minute.
Priya Nair: I can update the on-call checklist so the status page is updated within five minutes, and I will brief support on where to look.
Marcus Lee: And I'll schedule a load test with a copy of production data, so that large migrations can be rehearsed before release.
Tara Singh: Thank you. I will publish the written postmortem by Friday and we will review these actions in two weeks.
""",
        "overview": "A hand-written index migration locked the orders table and caused a twenty-three-minute checkout outage, with about four hundred and ten failed checkout attempts. The migration left out the concurrent option, and the small test table hid the problem. Detection took three minutes and the status page was not updated until late. The team agreed on a migration lint rule, an error-rate alert, a status page step in the on-call checklist, and a load test with production-sized data.",
        "key_points": [
            "An index migration without the concurrent option locked the orders table at 2:04.",
            "Checkout was down for twenty-three minutes and about four hundred and ten attempts failed.",
            "The test environment's small table hid the lock, and review did not catch it.",
            "The alert took three minutes to fire because it waits for five failed health checks.",
            "The status page was not updated until 2:25, leaving support without information.",
        ],
        "keywords": ["outage", "migration", "index", "alerting", "status page", "postmortem"],
        "chapters": [
            (0, "Timeline of the outage", "A migration deployed at 2:04 locked the orders table; checkout recovered at 2:29."),
            (5, "Customer impact", "Twenty-three minutes of downtime and about four hundred and ten failed attempts."),
            (9, "Root cause", "The hand-written migration skipped the concurrent option and the test table was too small to show it."),
            (13, "Detection and communication", "Alerting was slow and the status page was updated late."),
            (18, "Corrective actions", "A lint rule, a faster alert, a checklist change and a production-sized load test."),
        ],
        "action_items": [
            (19, "Add a pipeline lint rule that rejects index migrations without the concurrent option", "Jordan Kim", True),
            (20, "Create a checkout error-rate alert with one-minute detection", "Tara Singh", True),
            (21, "Add a status page update step to the on-call checklist and brief support", "Priya Nair", False),
            (22, "Schedule a load test using a copy of production data", "Marcus Lee", False),
            (23, "Publish the written postmortem by Friday", "Tara Singh", True),
        ],
    },
]
