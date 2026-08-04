import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import markdownItFootnote from "markdown-it-footnote";

const readableDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/feed.xml",
    collection: { name: "post", limit: 0 },
    metadata: {
      title: "Niklas Gruhn",
      subtitle: "Notes on software, mostly.",
      language: "en",
      base: "https://gruhn.me/",
      author: { name: "Niklas Gruhn" },
    },
  });

  eleventyConfig.amendLibrary("md", (md) => md.use(markdownItFootnote));

  // Copied to the output root, so assets keep their current URLs (/style.css etc).
  eleventyConfig.addPassthroughCopy({ "src/static": "." });

  eleventyConfig.addFilter("readableDate", (date) => readableDate.format(date));
  eleventyConfig.addFilter("isoDate", (date) => date.toISOString().slice(0, 10));

  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
