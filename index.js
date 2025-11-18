// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ======== Definição das profissões ========
const PROFESSOES = {
  DADOS: 'Cientista de Dados / I.A',
  FRONTEND: 'Programador Frontend',
  DEVOPS: 'Devops',
  BACKEND: 'Programador Backend',
  QA: 'QA (Quality Assurance)',
  UXUI: 'UX/UI',
  PROD: 'Gestão de Produtos'
};

// ======== Questionário e regras ========
const QUESTIONARIO = [
  {
    text: '1/6 - Quando você pensa em tecnologia, o que mais te chama atenção?',
    options: [
      '1) Entender padrões em dados e criar modelos inteligentes.',
      '2) Criar telas bonitas, animadas e responsivas.',
      '3) Manter sistemas estáveis, automatizados e rodando na nuvem.',
      '4) Pensar nas regras de negócio e como o sistema funciona por trás.'
    ],
    scoring: {
      '1': { DADOS: 2, PROD: 1 },
      '2': { FRONTEND: 2, UXUI: 1 },
      '3': { DEVOPS: 2, QA: 1 },
      '4': { BACKEND: 2, PROD: 1 }
    }
  },
  {
    text: '2/6 - Em um trabalho em grupo, qual tarefa você preferiria?',
    options: [
      '1) Medir resultados, analisar métricas e apresentar insights.',
      '2) Prototipar a interface no Figma ou semelhante.',
      '3) Montar pipeline de deploy, CI/CD e infraestrutura.',
      '4) Implementar as regras de negócio e endpoints da API.'
    ],
    scoring: {
      '1': { DADOS: 2, PROD: 1 },
      '2': { UXUI: 2, FRONTEND: 1 },
      '3': { DEVOPS: 2, BACKEND: 1 },
      '4': { BACKEND: 2, QA: 1 }
    }
  },
  {
    text: '3/6 - Qual dessas atividades você acha mais divertida?',
    options: [
      '1) Treinar modelos de machine learning e testar hipóteses.',
      '2) Trabalhar com HTML/CSS/JS para deixar algo visualmente incrível.',
      '3) Criar scripts de automação, monitoramento e logs.',
      '4) Testar o sistema caçando bugs e garantindo qualidade.'
    ],
    scoring: {
      '1': { DADOS: 2 },
      '2': { FRONTEND: 2, UXUI: 1 },
      '3': { DEVOPS: 2, BACKEND: 1 },
      '4': { QA: 2 }
    }
  },
  {
    text: '4/6 - O que mais te incomoda em um sistema ruim?',
    options: [
      '1) Decisões sendo tomadas sem base em dados.',
      '2) Interface feia, confusa ou difícil de usar.',
      '3) Sistema fora do ar, lento ou instável.',
      '4) Bugs, erros e funcionalidades quebradas.'
    ],
    scoring: {
      '1': { DADOS: 2, PROD: 1 },
      '2': { UXUI: 2, FRONTEND: 1 },
      '3': { DEVOPS: 2, BACKEND: 1 },
      '4': { QA: 2 }
    }
  },
  {
    text: '5/6 - Qual habilidade você gostaria mais de desenvolver?',
    options: [
      '1) Estatística, modelagem de dados e IA.',
      '2) Design de interfaces, animações e UX.',
      '3) Cloud, containers, automação e segurança.',
      '4) Arquitetura de software, APIs e modelagem de domínio.'
    ],
    scoring: {
      '1': { DADOS: 2 },
      '2': { UXUI: 2, FRONTEND: 1 },
      '3': { DEVOPS: 2 },
      '4': { BACKEND: 2, PROD: 1 }
    }
  },
  {
    text: '6/6 - No futuro, como você gostaria de atuar em projetos?',
    options: [
      '1) Guiando decisões com dados e experimentos.',
      '2) Sendo referência em usabilidade e experiência do usuário.',
      '3) Garantindo que tudo seja entregue com qualidade e estabilidade.',
      '4) Como responsável pela visão do produto e priorização do que será feito.'
    ],
    scoring: {
      '1': { DADOS: 2 },
      '2': { UXUI: 2, FRONTEND: 1 },
      '3': { QA: 2, DEVOPS: 1 },
      '4': { PROD: 2, BACKEND: 1 }
    }
  }
];

// ======== Estado das sessões ========
const sessions = new Map();

function criarSessao() {
  return {
    currentQuestion: 0,
    scores: {
      DADOS: 0,
      FRONTEND: 0,
      DEVOPS: 0,
      BACKEND: 0,
      QA: 0,
      UXUI: 0,
      PROD: 0
    }
  };
}

function aplicarPontuacao(session, questionIndex, respostaTexto) {
  const scoring = QUESTIONARIO[questionIndex].scoring[respostaTexto];
  if (!scoring) return;
  for (const key of Object.keys(scoring)) {
    session.scores[key] += scoring[key];
  }
}

function calcularResultado(scores) {
  let melhor = null;
  let maior = -Infinity;
  for (const [key, valor] of Object.entries(scores)) {
    if (valor > maior) {
      maior = valor;
      melhor = key;
    }
  }
  return melhor;
}

function descricaoProfissao(key) {
  switch (key) {
    case 'DADOS': return `🧠 Cientista de Dados / IA\nVocê gosta de analisar, modelar e entender padrões!`;
    case 'FRONTEND': return `🎨 Programador Frontend\nCriatividade visual, interfaces e animações são seu forte!`;
    case 'DEVOPS': return `⚙️ DevOps\nVocê curte automação, cloud e estabilidade!`;
    case 'BACKEND': return `💻 Programador Backend\nRegras de negócio, APIs, lógica — você manda bem nisso!`;
    case 'QA': return `🔍 QA - Quality Assurance\nVocê gosta de caçar bugs e garantir qualidade!`;
    case 'UXUI': return `📱 UX/UI\nVocê pensa na experiência e no usuário em primeiro lugar!`;
    case 'PROD': return `📊 Gestão de Produtos\nEstratégia, visão e priorização — seu perfil é de liderança!`;
    default: return 'Não foi possível determinar um perfil.';
  }
}

function formatarPergunta(i) {
  const q = QUESTIONARIO[i];
  return `📝 ${q.text}\n\n${q.options.join('\n')}\n\nResponda com o número da opção.`;
}

// ============= WhatsApp Client =============
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox'] }
});

client.on('qr', qr => {
  console.log("🚀 Escaneie o QR abaixo:");
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log("✅ Bot conectado!");
});

client.on('message', async msg => {
  const from = msg.from;
  const text = msg.body.trim().toLowerCase();

  if (['reiniciar', 'reset'].includes(text)) {
    sessions.delete(from);
    return msg.reply("🔄 Teste reiniciado. Digite *teste* para começar.");
  }

  let session = sessions.get(from);

  if (!session) {
    if (text === 'teste' || text === 'iniciar') {
      session = criarSessao();
      sessions.set(from, session);
      return msg.reply("👋 Bem-vindo ao *Teste Vocacional de Tecnologia*! Vamos começar.\n\n" + formatarPergunta(0));
    } else {
      return msg.reply("Digite *teste* para iniciar o teste vocacional.");
    }
  }

  if (!['1', '2', '3', '4'].includes(text)) {
    return msg.reply("❗ Responda apenas com 1, 2, 3 ou 4.\n\n" + formatarPergunta(session.currentQuestion));
  }

  aplicarPontuacao(session, session.currentQuestion, text);
  session.currentQuestion++;

  if (session.currentQuestion < QUESTIONARIO.length) {
    return msg.reply(formatarPergunta(session.currentQuestion));
  }

  const resultado = calcularResultado(session.scores);
  await msg.reply("🏁 Teste concluído!\n\n" + descricaoProfissao(resultado));
  sessions.delete(from);
});

client.initialize();
