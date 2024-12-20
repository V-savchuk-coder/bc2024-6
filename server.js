const express = require('express');
const { Command } = require('commander');
const fs = require('fs');
const fsSync = require('fs');

const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

// Оголошення програми для отримання параметрів з командного рядка
const program = new Command();
program
  .requiredOption('-h, --host <type>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до директорії для кешу');

program.parse(process.argv);

const options = program.opts();

// Налаштування сервера
const app = express();
const { host, port, cache } = options;

const file = fsSync.readFileSync('openapi.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);

// Now you can use the app object
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(bodyParser.json());
const upload = multer();

// Функції для роботи з нотатками (файлами)
const getNotePath = (noteName) => path.join(cache, `${noteName}.txt`);

const readNote = (noteName) => {
  const notePath = getNotePath(noteName);
  if (!fs.existsSync(notePath)) return null;
  return fs.readFileSync(notePath, 'utf8');
};

const writeNote = (noteName, text) => {
  const notePath = getNotePath(noteName);
  fs.writeFileSync(notePath, text, 'utf8');
};

const deleteNote = (noteName) => {
  const notePath = getNotePath(noteName);
  if (fs.existsSync(notePath)) fs.unlinkSync(notePath);
};

// Роут для отримання конкретної нотатки
app.get('/notes/:noteName', (req, res) => {
  const noteContent = readNote(req.params.noteName);
  if (!noteContent) return res.status(404).send('Not found');
  res.send(noteContent);
});

app.put('/notes/:note_name', express.text(), (req, res) => {
  const noteName = req.params.note_name;
  const note = req.body;

  if (!readNote(noteName)) {
    return res.status(404).send('Note not found');
  }
  writeNote(noteName, note);
  res.status(200).send('Note updated');
});
// Роут для видалення нотатки
app.delete('/notes/:noteName', (req, res) => {
  const { noteName } = req.params;
  if (!readNote(noteName)) return res.status(404).send('Not found');
  deleteNote(noteName);
  res.sendStatus(200);
});

// Роут для отримання списку всіх нотаток
app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cache)
    .filter(file => file.endsWith('.txt'))
    .map(file => {
      const name = file.slice(0, -4); // Витягуємо ім'я без розширення
      const text = readNote(name);
      return { name, text };
    });
  res.status(200).json(notes);
});

// Роут для створення нової нотатки
app.post('/write', upload.none(), (req, res) => {
  const { note_name, note } = req.body;
  if (readNote(note_name)) return res.status(400).send('Note already exists');
  writeNote(note_name, note);
  res.status(201).send('Created');
});

// Роут для завантаження HTML форми
app.get('/UploadForm.html', (req, res) => {
  const filePath = path.join(__dirname, 'UploadForm.html');
  res.sendFile(filePath);
});

// Запуск сервера
app.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`);
  console.log(`Кеш директорія: ${cache}`);
});
