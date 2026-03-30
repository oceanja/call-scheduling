/**
 * Rule-based mentor ranking (vectorless). Tags are lowercase substring-matched.
 */

const TAG = {
  TECH: "tech",
  NON_TECH: "non-tech",
  BIG_COMPANY: "big company",
  BIG_TECH: "big tech",
  PUBLIC_COMPANY: "public company",
  INDIA: "india",
  IRELAND: "ireland",
  SENIOR_DEV: "senior developer",
  GOOD_COMM: "good communication",
  ASKS_QUESTIONS: "asks a lot of questions",
};

function norm(s) {
  return (s || "").toLowerCase();
}

function tagScore(mentorTags, want) {
  const t = mentorTags.map(norm);
  return want.some((w) => t.includes(w)) ? 1 : 0;
}

function textOverlap(a, b) {
  const wordsA = norm(a)
    .split(/\W+/)
    .filter((w) => w.length > 2);
  const setB = new Set(norm(b).split(/\W+/).filter((w) => w.length > 2));
  if (!wordsA.length || !setB.size) return 0;
  let hit = 0;
  for (const w of wordsA) {
    if (setB.has(w)) hit += 1;
  }
  return hit / Math.max(wordsA.length, 1);
}

/**
 * @param {import("@prisma/client").CallType} callType
 * @param {{ tags: string[]; description: string | null }} mentee
 * @param {Array<{ id: string; name: string; email: string; tags: string[]; description: string | null }>} mentors
 */
export function rankMentorsForCall(callType, mentee, mentors) {
  const out = [];

  for (const m of mentors) {
    let score = 0;
    const reasons = [];
    const mt = m.tags.map(norm);
    const ut = mentee.tags.map(norm);

    if (callType === "RESUME_REVAMP") {
      const w = tagScore(m.tags, [TAG.BIG_TECH, TAG.BIG_COMPANY]);
      score += w * 3;
      if (w) reasons.push("Strong fit: big tech / big company background");
      if (mt.includes(TAG.TECH) && ut.includes(TAG.TECH)) {
        score += 1;
        reasons.push("Tech background aligned");
      }
    } else if (callType === "JOB_MARKET_GUIDANCE") {
      const w = tagScore(m.tags, [TAG.GOOD_COMM]);
      score += w * 4;
      if (w) reasons.push("Marked as strong communication");
      score += textOverlap(mentee.description || "", m.description || "") * 2;
    } else if (callType === "MOCK_INTERVIEW") {
      const techMatch =
        (ut.includes(TAG.TECH) && mt.includes(TAG.TECH)) ||
        (ut.includes(TAG.NON_TECH) && mt.includes(TAG.NON_TECH));
      if (techMatch) {
        score += 2;
        reasons.push("Same tech / non-tech lane");
      }
      const overlap = textOverlap(mentee.description || "", m.description || "");
      score += overlap * 3;
      if (overlap > 0.1) reasons.push("Description topics overlap");
      const shared = ut.some((t) => mt.includes(norm(t)));
      if (shared) {
        score += 1;
        reasons.push("Overlapping profile tags");
      }
    }

    score += textOverlap(mentee.description || "", m.description || "");

    out.push({
      mentor: {
        id: m.id,
        name: m.name,
        email: m.email,
        tags: m.tags,
        description: m.description,
      },
      score: Math.round(score * 100) / 100,
      reasons: reasons.length ? reasons : ["Baseline match"],
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out;
}
