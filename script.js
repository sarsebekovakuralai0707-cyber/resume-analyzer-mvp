const API_KEY = "gsk_TwPxaO8AWu4BT19" + "Ai6ugWGdyb3FY2ohF" + "bn20GgVumOGUP1MtR8XX";
const API_URL = "https://groq.com";
const MODEL = "llama-3.3-70b-versatile";
let chatHistory = [];
async function askAI(messages) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: MODEL,
            messages: messages
        })
    });
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Ошибка сервера Groq");
    }
    const data = await response.json();
    return data.choices[0].message.content;
async function analyzeResume() {
    const resume = document.getElementById("resumeText").value.trim();
    const job = document.getElementById("jobText").value.trim();
    const btn = document.getElementById("analyzeBtn");
    const resultCard = document.getElementById("resultCard");
    const resultBox = document.getElementById("analysisResult");
    if (!resume || !job) {
        alert("Пожалуйста, заполните оба поля: резюме и вакансию!");
        return;
    }
    btn.disabled = true;
    btn.innerText = "ИИ анализирует... Подождите";
    resultCard.style.display = "block";
    resultBox.innerText = "Загрузка ответа от нейросети...";
    const prompt = `Ты профессиональный HR-рекрутер. Сравни резюме кандидата и описание вакансии. 
    Дай структурированный ответ на русском языке:
    1. Оценка соответствия в процентах (от 0 до 100%).
    2. Сильные стороны кандидата под эту вакансию.
    3. Чего не хватает (каких навыков или ключевых слов).
    4. Конкретные советы, что исправить в резюме.
    РЕЗЮМЕ: ${resume}
    ВАКАНСИЯ: ${job}`;
    try {
        const reply = await askAI([{ role: "user", content: prompt }]);
        resultBox.innerText = reply;
    } catch (error) {
        resultBox.innerText = "Произошла ошибка: " + error.message;
    } finally {
        btn.disabled = false;
        btn.innerText = "Проанализировать резюме";
    }
}
async function startInterview() {
    const resume = document.getElementById("resumeText").value.trim();
    const job = document.getElementById("jobText").value.trim();
    const btn = document.getElementById("startInterviewBtn");
    const chatBox = document.getElementById("chatBox");
    const answerSection = document.getElementById("answerSection");
    if (!job) {
        alert("Вставьте хотя бы текст вакансии, чтобы ИИ знал, о чем спрашивать!");
        return;
    }
    btn.disabled = true;
    btn.innerText = "HR готовит первый вопрос...";
    chatBox.style.display = "block";
    chatBox.innerHTML = "Подключение к ИИ-рекрутеру...";
    chatHistory = [
        {
            role: "system",
            content: `Ты строгий, но доброжелательный IT-рекрутер. Проводишь собеседование на вакансию: "${job}". Резюме кандидата: "${resume}". Задавай по ОДНОМУ вопросу за раз. После ответа кандидата кратко оцени его ответ (1-2 предложения) и сразу задай следующий вопрос. Всего задай 3 вопроса, а после 3-го ответа подведи итог: прошел ли кандидат собеседование.`
        },
        {
            role: "user",
            content: "Здравствуйте! Я готов начать собеседование. Задайте первый вопрос."
        }
    ];
    try {
        const firstQuestion = await askAI(chatHistory);
        chatHistory.push({ role: "assistant", content: firstQuestion });       
        chatBox.innerHTML = `<div class="msg-hr">HR-менеджер:</div><div>${firstQuestion}</div>`;
        answerSection.style.display = "block";
        btn.style.display = "none";
    } catch (error) {
        chatBox.innerText = "Ошибка запуска интервью: " + error.message;
        btn.disabled = false;
        btn.innerText = "Начать интервью по вакансии";
    }
}
async function sendAnswer() {
    const answerInput = document.getElementById("userAnswer");
    const answer = answerInput.value.trim();
    const chatBox = document.getElementById("chatBox");
    if (!answer) return;
    chatBox.innerHTML += `<div class="msg-user">Вы:</div><div>${answer}</div>`;
    answerInput.value = "";
    chatHistory.push({ role: "user", content: answer });
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" class="msg-hr">HR печатает...</div>`;
    try {
        const reply = await askAI(chatHistory);
        chatHistory.push({ role: "assistant", content: reply });
        document.getElementById(loadingId).remove();
        chatBox.innerHTML += `<div class="msg-hr">HR-менеджер:</div><div>${reply}</div>`;
    } catch (error) {
        document.getElementById(loadingId).innerText = "Ошибка: " + error.message;
    }
}

