/* =====================================================================================================================
   LearnLink student app: demo mode (?demo)
   ---------------------------------------------------------------------------------------------------------------------
   Opened on its own (apps/student.html?demo&start=app) the app has no server: it shows these sample courses and
   answers a few questions with canned text, so the screens can be shown without the AI. Nothing here runs when the
   app is live inside login.html. To change what the demo says, edit the data below.
   ===================================================================================================================== */

var SAMPLE_COURSES = [
  ["GE PPC", "Liza Navarro", "GE", ["What Is Popular Culture?", "Media and Society", "Filipino Pop Icons", "Social Media Trends"]],
  ["Information Assurance", "Ramon Dizon", "CCIS", ["Introduction to Information Assurance", "Security Principles", "Risk Management", "Cryptography Basics"]],
  ["Prof Elec 2", "Jomar Villareal", "CCIS", ["Web Architecture", "HTML and CSS Review", "Flexbox and Grid", "JavaScript Basics"]],
  ["GE Ethics", "Andrea Mae Salazar", "GE", ["Foundations of Ethics", "Moral Theories", "Professional Ethics", "Ethics in Technology"]],
  ["IT 313", "Aurora Pineda", "CCIS", ["Course Overview", "Core Concepts", "Applications", "Case Studies"]],
  ["Research Methods", "Carmela Reyes", "CCIS", ["Research Basics", "Review of Literature", "Methodology", "Data Analysis"]]
].map(function (c) {
  return { id: null, name: c[0], teacher: c[1], college: c[2], modules: c[3].map(function (t, i) { return { id: null, num: i + 1, title: t } }) }
});
if (!LIVE) COURSES = SAMPLE_COURSES;

// Sample content of the Information Assurance modules: summary sentences, one quiz question
// [question, options, index of the right option], and flashcards [front, back].
var SAMPLE_IA = [
  {
    summary: ["Information assurance protects how information is used, stored, and shared.",
      "It combines technology, people, and policy instead of relying on tools alone.",
      "Its goal is to keep information trustworthy and available."],
    quiz: ["What does information assurance combine?", ["Technology, people, and policy", "Hardware only", "Software licenses"], 0],
    cards: [["What is information assurance?", "Protecting how information is used, stored, and shared."]]
  },
  {
    summary: ["The CIA triad is built on confidentiality, integrity, and availability.",
      "Confidentiality limits who can see data, and integrity keeps it accurate and unaltered.",
      "Availability means systems and data can be reached when needed."],
    quiz: ["Which goal means data is not changed without permission?", ["Confidentiality", "Integrity", "Availability"], 1],
    cards: [["Confidentiality", "Only authorized people can see the data."], ["Availability", "Systems and data are reachable when needed."]]
  },
  {
    summary: ["Risk is the chance that a threat exploits a weakness and causes harm.",
      "Assessment identifies assets, threats, and vulnerabilities.",
      "Responses include accepting, reducing, transferring, or avoiding risk."],
    quiz: ["Which is a way to respond to risk?", ["Transferring it", "Ignoring the asset", "Deleting the policy"], 0],
    cards: [["What is a vulnerability?", "A weakness a threat can exploit."]]
  },
  {
    summary: ["Encryption turns readable data into unreadable data using a key.",
      "Symmetric methods share one key; asymmetric methods use a key pair.",
      "Hashing creates a fixed fingerprint used to check integrity."],
    quiz: ["Which technique checks that data was not changed?", ["Hashing", "Compression", "Formatting"], 0],
    cards: [["Hash", "A fixed-length fingerprint of data."]]
  }
];

// Sample content of any module: the real-looking Information Assurance text, or generic lines for the rest.
function sampleModule(c, m) {
  if (COURSES[c].name === "Information Assurance" && SAMPLE_IA[m]) return SAMPLE_IA[m];
  var t = COURSES[c].modules[m].title;
  return {
    summary: ["This module introduces the key ideas of " + t + ".", "It explains the main terms and how they connect.",
      "It closes with examples you can use to review."],
    quiz: ["Which topic does this module focus on?", [t, "An unrelated topic", "A different course"], 0],
    cards: [["Main idea of " + t + "?", "Sample answer from the module."]]
  }
}

// Topics the demo can answer. match: words in the question. course / modules: where the answer comes from.
// answer / whyAnswer: [sentence, the sources it cites ("12" = [1][2])]. whyAnswer is used for follow-ups like
// "why is it important?". highlights: per source, which summary sentences the viewer marks.
var SAMPLE_TOPICS = [
  {
    match: /cia|confidential|integrity|availab|security/, course: 1, modules: [1, 0],
    answer: [["The CIA triad is a model built on three security goals.", "1"],
      ["Confidentiality limits who can see data, and integrity keeps it accurate and unaltered.", "12"],
      ["Availability means systems and data can be reached when needed.", "2"]],
    whyAnswer: [["It gives organizations a common checklist for deciding what needs protecting.", "1"],
      ["A weakness in any one goal is a security failure, so all three must be balanced.", "12"],
      ["It also guides which controls to choose, such as access control, hashing, and backups.", "2"]],
    whyQuestion: "Why is the CIA triad important?",
    highlights: [[0, 1, 2], [2]]
  },
  {
    match: /ethic|moral/, course: 3, modules: [0, 1],
    answer: [["Morality is the set of beliefs about right and wrong that a person or community holds.", "1"],
      ["Ethics is the systematic study of those beliefs and whether the reasons behind them hold up.", "12"]],
    whyAnswer: [["It helps us judge decisions with reasons instead of habit or opinion.", "1"],
      ["In IT work it guides choices about privacy, honesty, and impact on people.", "2"]],
    whyQuestion: "Why is ethics important?",
    highlights: [[0], [0, 1]]
  }
];
var lastTopic = null;   // the topic of the last module answer, for follow-ups ("why is it important?")

// Greetings and thanks get a short reply (live, the server does this).
function sampleSmallTalk(q) {
  var t = q.trim().toLowerCase().replace(/[!.?,]+$/, "");
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|kumusta|musta)$/.test(t)) return "Hi " + displayName() +
    "! I can help you study from your course modules, or answer other questions too. What would you like to look at today?";
  if (/^(can|may|could) i ask( you)?( a| another| something)?( question)?$/.test(t) || /^i (have|got) a question$/.test(t)) return "Of course, go ahead. Ask about any of your courses, or anything else.";
  if (/^how are you/.test(t)) return "I’m doing well, thanks for asking. Want to review a topic from one of your courses?";
  if (/^(thanks|thank you|ty|salamat)$/.test(t)) return "You’re welcome! Let me know if you want to go over anything else.";
  if (/^(bye|goodbye)$/.test(t)) return "See you! Good luck with your studies.";
  return null
}

// The demo's answer to a question: { message, sources (index in SOURCES, or -1), quick (short wait, no status) }.
function sampleReply(q) {
  var small = sampleSmallTalk(q);
  if (small) return { quick: true, sources: -1, message: { html: '<p style="margin:0;line-height:1.7">' + small + "</p>" } };

  var topic = null;
  SAMPLE_TOPICS.forEach(function (x) { if (!topic && x.match.test(q.toLowerCase())) topic = x });
  var followUp = q.split(/\s+/).length <= 10 && (/\b(it|this|that|they|them)\b/i.test(q) || /^(why|how come)/i.test(q));
  var sentences = null, understoodAs = null;
  if (topic) {
    lastTopic = topic;
    sentences = topic.answer
  } else if (followUp) {
    if (!lastTopic) return { quick: true, sources: -1, message: { html: '<p style="margin:0">Which topic do you mean? Tell me the course or the topic and I’ll look it up in your modules.</p>' } };
    topic = lastTopic;
    sentences = topic.whyAnswer;
    understoodAs = topic.whyQuestion
  }

  if (sentences) {
    var c = COURSES[topic.course];
    var si = SOURCES.push({
      title: c.name + " · " + c.teacher,
      items: topic.modules.map(function (m, i) {
        return { title: "Module " + c.modules[m].num + ": " + c.modules[m].title, meta: ["Pages 8–10", "Slides 5–6"][i] || "Page 4",
          text: sampleModule(topic.course, m).summary[topic.highlights[i][0]], course: topic.course, module: m, sentences: topic.highlights[i] }
      })
    }) - 1;
    return {
      quick: false, sources: si, message: {
        html: chip("From your modules · " + esc(c.name) + " · " + esc(c.college)) +
          (understoodAs ? '<p class="sm" style="margin:8px 0 0">↳ Understood as: ' + understoodAs + "</p>" : "") +
          '<p style="margin:10px 0;line-height:1.8">' + sentences.map(function (s) {
            return esc(s[0]) + " " + s[1].split("").map(function (n) { return citeButton(si, n) }).join("")
          }).join(" ") + "</p>" + sourcesButton(si, topic.modules.length)
      }
    }
  }
  if (S.online) return { quick: false, sources: -1, message: {
    html: chip("General answer · not from your modules", "n") + '<p style="margin:10px 0 4px;line-height:1.7">' +
      (/world cup/i.test(q) ? "Argentina won the 2022 FIFA World Cup in Qatar, beating France on penalties after a 3-3 final." : "This is a general answer from the AI’s own knowledge. The demo has no live AI, so this is a sample reply.") +
      '</p><p class="sm" style="margin:0">Your modules didn’t cover this. Verify before using it in coursework.</p>' } };
  return { quick: false, sources: -1, message: {
    html: chip("Offline · no module match", "w") + '<p style="margin:10px 0 0">I couldn’t find this in your modules, and you’re offline, so I can’t give a general answer. Reconnect and ask again.</p>' } }
}

// Ask in the demo: show "Finding modules…" like the real app, then the canned answer.
function askDemo(q) {
  var reply = sampleReply(q);
  var placeholder = { typing: true, html: typingDots(reply.quick ? "" : "Finding modules…") };
  CHAT.push(placeholder);
  BUSY = true;
  render();
  if (!reply.quick) setTimeout(function () { placeholder.html = typingDots("Writing the answer…"); render() }, 900);
  setTimeout(function () {
    CHAT[CHAT.indexOf(placeholder)] = reply.message;
    if (reply.sources > -1) { S.sourcesIndex = reply.sources; S.sourcesOpen = true; S.sourceMarked = 0 }
    BUSY = false;
    render()
  }, reply.quick ? 700 : 1800)
}

// The course space's Ask tab in the demo: two summary sentences of the first module in scope.
function sampleSpaceAnswer() {
  var s = sampleModule(S.course, spaceModules()[0]).summary;
  return { html: s[0] + " " + s[1], modules: spaceModules().slice(0, 2) }
}
