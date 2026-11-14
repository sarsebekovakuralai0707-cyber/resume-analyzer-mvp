const GROQ_URL = 'https://api.groq.com' + '/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
let interviewHistory = [];

window.onload = () => {
  const savedKey = localStorage.getItem('groq_api_key');
  if (savedKey) {
    document.getElementById('apiKey').value = savedKey;
  }
};

function getApiKey() {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) {
    alert('Пожалуйста, вставьте ваш Groq API Key!');
    return null;
  }
  localStorage.setItem('groq_api_key', key);
  return key;
}

async function callGroq(messages) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Ошибка сервера: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeResume() {
  const resume = document.getElementById('resumeText').value.trim();
  const job = document.getElementById('jobText').value.trim();
  const resultDiv = document.getElementById('auditResult');
  const btn = document.getElementById('analyzeBtn');

  if (!resume || !job) {
    alert('Заполните текст резюме и текст вакансии!');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Анализирую...';
  resultDiv.textContent = 'ИИ изучает ваше резюме и сравнивает с требованиями вакансии...';

  try {
    const prompt = `Ты опытный карьерный консультант и HR-специалист. Проанализируй резюме кандидата под указанную вакансию.
Дай структурированный ответ на русском языке:
1. Оценка соответствия (в процентах от 0 до 100%).
2. Сильные стороны кандидата под эту вакансию.
3. Чего не хватает (пробелы в навыках или опыте).
4. Конкретные рекомендации, что переписать или добавить в резюме.

Резюме:
${resume}

Вакансия:
${job}`;

    const reply = await callGroq([{ role: 'user', content: prompt }]);
    if (reply) {
      resultDiv.textContent = reply;
    }
  } catch (error) {
    resultDiv.textContent = 'Ошибка при анализе: ' + error.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Проанализировать резюме';
  }
}

function appendMessage(role, text) {
  const chatBox = document.getElementById('chatBox');
  chatBox.style.display = 'block';
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${role}`;
  msgDiv.textContent = (role === 'ai' ? 'HR-ИИ: ' : 'Вы: ') + text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function startInterview() {
  const resume = document.getElementById('resumeText').value.trim();
  const job = document.getElementById('jobText').value.trim();
  const btn = document.getElementById('startInterviewBtn');

  if (!resume || !job) {
    alert('Сначала заполните резюме и вакансию в Блоке 1!');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Запуск интервью...';
  document.getElementById('chatBox').innerHTML = '';

  interviewHistory = [
    {
      role: 'system',
      content: `Ты строгий, но доброжелательный HR-рекрутер. Проводишь собеседование с кандидатом на основе его резюме (${resume}) и вакансии (${job}). Задавай по ОДНОМУ вопросу за раз. После ответа кандидата кратко оцени его ответ (1-2 предложения) и задай следующий вопрос. Общайся на русском языке.`
    },
    {
      role: 'user',
      content: 'Здравствуйте! Я готов начать собеседование. Задайте первый вопрос.'
    }
  ];

  try {
    const reply = await callGroq(interviewHistory);
    if (reply) {
      interviewHistory.push({ role: 'assistant', content: reply });
      appendMessage('ai', reply);
      document.getElementById('answerControls').style.display = 'block';
    }
  } catch (error) {
    alert('Ошибка запуска интервью: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Начать интервью заново';
  }
}

async function sendAnswer() {
  const answerInput = document.getElementById('userAnswer');
  const answer = answerInput.value.trim();
  const btn = document.getElementById('sendAnswerBtn');

  if (!answer) return;

  appendMessage('user', answer);
  answerInput.value = '';
  interviewHistory.push({ role: 'user', content: answer });

  btn.disabled = true;
  btn.textContent = 'HR думает...';

  try {
    const reply = await callGroq(interviewHistory);
    if (reply) {
      interviewHistory.push({ role: 'assistant', content: reply });
      appendMessage('ai', reply);
    }
  } catch (error) {
    appendMessage('ai', 'Ошибка связи: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отправить ответ';
  }
}
