import crypto from "crypto";
import dotenv from "dotenv";
import sqlCon from "../configs/sqlCon.js";
import puppeteer from "puppeteer";
import fs from "fs";
import { s3 } from "../configs/s3.js";
import { emailCon } from "../configs/emailCon.js";

dotenv.config({ path: "../.env" });
const conn = sqlCon();
export const makeGroupHashedID = (group_plain_id, group_plain_title) =>
  new Promise(async (resolve, reject) => {
    const salt = process.env.SALT;
    crypto.pbkdf2(
      String(group_plain_id) + group_plain_title,
      salt,
      9999,
      32,
      "sha512",
      (err, key) => {
        if (err) reject(err);
        resolve({ crypt: key.toString("hex") });
      }
    );
  });

export const encodeImageToBase64 = (imagePath) => {
  const image = fs.readFileSync(imagePath);
  return `data:image/png;base64,${image.toString("base64")}`;
};

export const contractPdfController = async (html, fileName, email) => {
  // Create a browser instance
  const browser = await puppeteer.launch({
    headless: "new",
    protocolTimeout: 60000, // 이건 다른 에러때문에 넣어놓은 옵션
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--enable-gpu"],
  });
  // Create a new page
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  // To reflect CSS used for screens instead of print
  await page.emulateMediaType("screen");
  // Wait for a selector that represents an image to be visible
  await page.waitForSelector("img");
  // or, wait for a specific amount of time
  // Download the PDF
  const PDF = await page.pdf({
    format: "A5",
  });
  let s3Url = "";

  await s3
    .upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: PDF,
    })
    .promise()
    .then(async (data) => {
      s3Url = data.Location;

      await emailCon.sendMail({
        from: `"The Dreaming, Suite" <${process.env.GMAIL_ID}>`,
        to: email,
        subject: "The Dreaming, Suite 당신의 순간을 응원합니다. [ 계약서 ]",
        text: "진심을 보증합니다, 당신이 찾는 그 곳. SUITE",
        attachments: [
          {
            filename: "SUITE-Contract.pdf", // Name of the PDF file as it will appear in the email
            content: PDF,
          },
        ],
      });
    })
    .catch((e) => {
      console.error(e);
    });

  // Close the browser instance
  await browser.close();
  return s3Url;
};

export const certificatedPdfController = async (html, fileName, email) => {
  // Create a browser instance
  const browser = await puppeteer.launch({
    headless: "new",
  });
  // Create a new page
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  // To reflect CSS used for screens instead of print
  await page.emulateMediaType("screen");
  // Wait for a selector that represents an image to be visible
  await page.waitForSelector("img");
  // or, wait for a specific amount of time
  // Download the PDF
  const PDF = await page.pdf({
    // format: "A4",
    width: "570px",
    height: "410px",
    printBackground: true,
  });
  let s3Url = "";

  await s3
    .upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: PDF,
    })
    .promise()
    .then(async (data) => {
      s3Url = data.Location;

      await emailCon.sendMail({
        from: `"The Dreaming, Suite" <${process.env.GMAIL_ID}>`,
        to: email,
        subject: "The Dreaming, Suite 당신의 순간을 응원합니다. [ 수료증 ]",
        text: "진심을 보증합니다, 당신이 찾는 그 곳. SUITE",
        attachments: [
          {
            filename: "SUITE-Certificated.pdf", // Name of the PDF file as it will appear in the email
            content: PDF,
          },
        ],
      });
    })
    .catch((e) => {
      console.error(e);
    });

  // Close the browser instance
  await browser.close();
  return s3Url;
};
