import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

function fallbackPlan(input) {
  const activity = input.activity || 'walk';
  const minutes = Math.max(20, Math.min(180, Number(input.minutes) || 60));
  const place = input.location || 'a nearby safe outdoor place';
  const plans = {
    walk: ['Start with 5 minutes of easy walking.', 'Spend 35–45 minutes exploring without your phone in your hand.', 'Pause for 5 minutes to notice three sounds, two textures and one interesting sight.', 'Walk back using a slightly different route.'],
    run: ['Warm up for 8 minutes with an easy walk/jog.', 'Run at a conversational pace for most of the outing.', 'Finish with 5 minutes easy and a gentle stretch.', 'Keep the route familiar and well-lit if running alone.'],
    hike: ['Check the route, daylight and water before leaving.', 'Start slowly for the first 10 minutes.', 'Take a short observation break halfway through.', 'Turn around before conditions become uncomfortable.'],
    garden: ['Pick one small area to work on.', 'Spend 10 minutes checking soil, sunlight and plant health.', 'Plant, prune or prepare one small section.', 'Finish by watering/cleaning tools and step away from the screen.'],
    birding: ['Find a quiet spot and let your eyes adjust.', 'Listen for calls before trying to identify anything.', 'Record only short notes: size, color, behavior and habitat.', 'Leave wildlife undisturbed and pack out everything you brought.']
  };
  const steps = plans[activity] || plans.walk;
  return {
    title: `${activity[0].toUpperCase()+activity.slice(1)} at ${place}`,
    duration: `${minutes} minutes`,
    why: 'A simple outdoor plan designed to make the phone useful for preparation, then put it away.',
    checklist: ['Water', 'Comfortable footwear', 'Weather-appropriate clothing', 'Phone on silent / emergency contact available'],
    steps,
    safety: 'Use a familiar or permitted area, check local conditions, tell someone where you are when appropriate, and turn back if conditions feel unsafe.',
    open_ai: true
  };
}

async function generatePlan(input) {
  const prompt = `You are TouchGrass, a concise outdoor activity planner. Create a realistic plan that gets the person away from the screen quickly. Do not invent live weather, trail closures, opening hours, wildlife sightings, or route facts. User details: activity=${input.activity}; location=${input.location}; duration=${input.minutes} minutes; fitness=${input.fitness}; interests=${input.interests}; constraints=${input.constraints}. Return ONLY valid JSON with keys: title, duration, why, checklist (array of strings), steps (array of strings), safety. Keep it practical and under 180 words.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST', headers: {'content-type':'application/json'},
      body: JSON.stringify({model: MODEL, prompt, stream: false, format: 'json', options: {temperature: 0.7}}),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const data = await response.json();
    const plan = JSON.parse(data.response);
    return {...plan, open_ai: true, model: MODEL};
  } finally { clearTimeout(timeout); }
}

function sendJson(res, status, body) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'});
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/plan') {
    let raw=''; req.on('data', c => raw += c); req.on('end', async () => {
      try {
        const input = JSON.parse(raw || '{}');
        try { return sendJson(res, 200, await generatePlan(input)); }
        catch { return sendJson(res, 200, {...fallbackPlan(input), local_model_unavailable: true}); }
      } catch { return sendJson(res, 400, {error:'Invalid JSON'}); }
    });
    return;
  }
  let file = req.url === '/' ? '/index.html' : req.url;
  file = path.normalize(file).replace(/^([.][.][\\/])+/, '');
  const target = path.join(publicDir, file);
  if (!target.startsWith(publicDir)) return sendJson(res, 403, {error:'Forbidden'});
  fs.readFile(target, (err, data) => {
    if (err) return sendJson(res, 404, {error:'Not found'});
    const ext = path.extname(target);
    const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
    res.writeHead(200, {'content-type': `${types[ext] || 'application/octet-stream'}; charset=utf-8`});
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`TouchGrass running at http://localhost:${PORT}`));
