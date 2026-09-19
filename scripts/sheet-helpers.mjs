import fs from 'fs';
import path from 'path';

// Helper to construct problem item
export function makeProblem(id, name, difficulty, platform, slug, topic, pattern, level, channel) {
  let link = "";
  if (platform === "LeetCode" && slug) {
    link = `https://leetcode.com/problems/${slug}/`;
  } else if (platform === "GeeksforGeeks" && slug) {
    link = slug.startsWith("http") ? slug : `https://www.geeksforgeeks.org/problems/${slug}/1`;
  } else if (slug && slug.startsWith("http")) {
    link = slug;
  } else {
    // If no direct link, fallback to google search as required:
    link = `https://www.google.com/search?q=${encodeURIComponent(name + " " + topic + " " + (platform || "DSA"))}`;
  }

  let videoSearch = "";
  if (channel === "takeUforward") {
    videoSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " takeUforward striver solution")}`;
  } else if (channel === "NeetCode") {
    videoSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " NeetCode solution")}`;
  } else if (channel === "CodeHelp - by Babbar") {
    videoSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " Love Babbar CodeHelp DSA solution")}`;
  } else if (channel === "RisingBrains") {
    videoSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " RisingBrains DSA solution")}`;
  } else {
    videoSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " DSA solution")}`;
  }

  return {
    id,
    name,
    difficulty,
    platform: platform || "LeetCode",
    link,
    pattern: pattern || topic,
    level: level || (difficulty === "Easy" ? "Level 1" : difficulty === "Medium" ? "Level 2" : "Level 3"),
    topic,
    channel,
    videoUrl: videoSearch
  };
}
