const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

require('dotenv').config();

app.post('/get-symptoms-analysis', async (req, res) => {
    const { symptoms } = req.body;
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'Вы полезный медицинский помощник.' },
                    { role: 'user', content: `Вот мои симптомы: ${symptoms}. Скажи названия 3 потенциальных заболевании и нужные действия и лекарства.Ответ не больше 75 слов без звездочек и оглавлении` }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ analysis: response.data.choices[0].message.content });
    } catch (error) {
        console.error('Ошибка при общении с OpenAI API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Что-то пошло не так!' });
    }
    
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
