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

app.post('/find-pharmacies', async (req, res) => {
    const { latitude, longitude } = req.body;
    const radius = 1000; // Радиус в метрах для поиска аптек

    try {
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(node["amenity"="pharmacy"](around:${radius},${latitude},${longitude}););out;`;
        const response = await axios.get(overpassUrl);
        const pharmacies = response.data.elements.map(pharmacy => ({
            name: pharmacy.tags.name || 'Без названия',
            lat: pharmacy.lat,
            lon: pharmacy.lon,
        }));

        res.json(pharmacies);
    } catch (error) {
        console.error('Ошибка при получении аптек:', error.message);
        res.status(500).json({ error: 'Не удалось найти аптеки.' });
    }
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
