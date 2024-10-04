const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

require('dotenv').config();

app.post('/find-drugs', async (req, res) => {
    const { disease } = req.body;

    try {
        // Запрос к OpenFDA API
        const response = await axios.get(`https://api.fda.gov/drug/event.json`, {
            params: {
                search: `patient.drug.drugindication:"${disease}"`,
                limit: 10  // Установите лимит результатов (например, 10)
            }
        });

        // Обработка ответа
        const results = response.data.results.map(event => ({
            drug: event.patient.drug[0].medicinalproduct,
            reaction: event.patient.reaction[0].reactionmeddrapt
        }));

        res.json({ drugs: results });
    } catch (error) {
        console.error('Ошибка при обращении к OpenFDA API:', error.message);
        res.status(500).json({ error: 'Ошибка при поиске лекарств' });
    }
});


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
    const radius = 1000;

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

app.post('/get-disease', async (req, res) => {
    const { symptoms } = req.body;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'Вы медицинский помощник. Укажите одну наиболее вероятную болезнь по введённым симптомам.' },
                    { role: 'user', content: `Вот мои симптомы: ${symptoms}. выведи одно наиболее вероятное заболевание в формате одного слова на английском. Например 'flu'.` }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.API_KEY}`, // Убедитесь, что вы установили API_KEY в .env
                    'Content-Type': 'application/json',
                },
            }
        );

        // Извлекаем одно слово из ответа
        const disease = response.data.choices[0].message.content.trim();
        res.json({ disease });
    } catch (error) {
        console.error('Ошибка при обращении к OpenAI API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Что-то пошло не так!' });
    }
});

app.post('/get-familiar-drug', async (req, res) => {
    const { drug } = req.body;
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'Вы полезный медицинский помощник.' },
                    { role: 'user', content: `Приведи более знакомую для обычных людей версию этого лекарства. Выведи в формате одного слова. Например если вывод TENOFOVIR DISOPROXIL FUMARATE то выведи Тенофовир: ${drug}.` }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const familiarDrug = response.data.choices[0].message.content.trim();
        res.json({ familiar_version: familiarDrug });
    } catch (error) {
        console.error('Ошибка при обработке названия лекарства:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Не удалось преобразовать название лекарства.' });
    }
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
