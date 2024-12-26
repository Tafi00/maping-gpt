require('dotenv').config();

const cheerio = require('cheerio');
const axios = require('axios');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const cokaFieldMenu = [
    "Fullname",
    "Email",
    "Phone",
    "Gender",
    "Note",
    "Dob",
    "PhysicalId",
    "DateOfIssue",
    "Address",
    "Rating",
    "Work",
    "Avatar",
    "AssignTo",
    "Other"
];

async function analyzeForm(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Lấy form đầu tiên
        const form = $('form').first();

        // Lấy toàn bộ HTML của form
        const formHtml = form.toString();

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a form field analyzer. Given an HTML form, analyze its elements and map them to these fields: ${cokaFieldMenu.join(', ')}. 
                             If you are not completely confident about a field's purpose, map it to "Other".
                             Analyze labels, placeholders, and other attributes to determine the purpose of each input field.
                             
                             Return ONLY a JSON array with this exact format:
                             [
                                 {
                                     "cokaField": "FieldName",
                                     "webField": {
                                         "cssSelector": "input#elementId"
                                     }
                                 }
                             ]
                             For each input, select, or textarea element, create a mapping based on its context.
                             The cssSelector should be specific enough to uniquely identify the form element.
                             Do not include any explanation or additional text. The response must be pure JSON.`
                },
                {
                    role: "user",
                    content: formHtml
                }
            ]
        });

        const jsonResponse = completion.choices[0].message.content.trim();
        return JSON.parse(jsonResponse);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

analyzeForm('https://kimanhholdings.vn/san-pham/pho-chuyen-gia-gia-khai-luxury-dang-cap-song-dang-cap-tai-ben-cat-binh-duong/').then(result => {
    console.log(JSON.stringify(result, null, 2));
}).catch(error => {
    console.error('Error:', error);
});
