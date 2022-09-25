import fetch from "node-fetch";
import { load } from "cheerio";
import URL from "url";
import fs from "fs";

const RESULTS_FILE_NAME = "results.json"

const resultJson = {
  results: [],
};

const run = async () => {
  const [initUrl, limit = 0] = process.argv.slice(2);
  console.info('Start fetching...');
  await getImages(initUrl, limit, 0);
  console.info('Fetching finished...');
  const data = JSON.stringify(resultJson, null, 2);
  fs.writeFileSync(RESULTS_FILE_NAME, data);
  console.info(`Data was saved in ${RESULTS_FILE_NAME}`)
};

const getImages = async (sourceUrl, limit, currentDepth) => {
  try {
    const res = await fetch(sourceUrl);
    const html = await res.text();
    const $ = load(html);
    const imageUrls = [...$("img")]
      .map((image) => image.attribs.src);
    imageUrls.forEach((imageUrl) =>
      resultJson.results.push({ imageUrl, sourceUrl, depth: currentDepth })
    );
    if (currentDepth < limit) {
      const nextLevelUrls = getNestedLinks($, sourceUrl);
      await Promise.all(
        nextLevelUrls.map(async (href) => {
          await getImages(href, limit, currentDepth + 1);
        })
      );
    }
  } catch (error) {
    console.error("Cant fetch with error", error.message);
  }
};

const getNestedLinks = ($, sourceUrl) => {
  const baseUrl = URL.parse(sourceUrl);
  const nextLevelUrls = [...$("a")]
    .reduce((nextLevelUrls, linkElement) => {
      const href = linkElement.attribs.href;
      if (href?.startsWith("/")) {
        nextLevelUrls.push(`${baseUrl.protocol}//${baseUrl.hostname}${href}`);
      }
      return nextLevelUrls;
    }, []);
  return nextLevelUrls;
};

run();
