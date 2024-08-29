const puppeteer = require('puppeteer');
const path = require('path');

// Função para aguardar um tempo determinado
function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time);
  });
}

async function sendMessage(page, contactName, imagePath) {
  console.log(`Buscando contato: ${contactName}`);
  
  // Aguarda o campo de pesquisa
  await page.waitForSelector('div[aria-label="Pesquisar"]', { timeout: 60000 });
  await page.type('div[aria-label="Pesquisar"]', contactName);
  await delay(2000);

  // Seleciona o contato
  const contact = await page.$(`span[title='${contactName}']`);
  if (contact) {
    await contact.click();
    console.log(`Contato ${contactName} selecionado.`);
  } else {
    console.log(`Contato "${contactName}" não encontrado.`);
    return;
  }

  // Espera a janela de conversa carregar
  await page.waitForSelector('div[aria-placeholder="Digite uma mensagem"]', { timeout: 60000 });
  console.log('Janela de conversa carregada.');

  // Clica no botão de adicionar
  await page.waitForSelector('span[data-icon="plus"]', { timeout: 60000 });
  console.log('Clicando no botão de adicionar...');
  await page.click('span[data-icon="plus"]');
  await delay(1000);

  console.log(`Tentando enviar imagem de ${imagePath}`);
  // Envia a imagem diretamente ao input file
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.evaluate(() => document.querySelector('input[type=file]').click())
  ]);
	
  // Verificação adicional se o fileChooser foi acionado corretamente
  try {
    await fileChooser.accept([imagePath]);
    console.log('Imagem selecionada.');
  } catch (error) {
    console.log('Erro ao selecionar a imagem:', error);
  }

  await delay(1000);

  // Clica no botão de enviar
  console.log('Clicando no botão de enviar...');
  await page.click('span[data-icon="send"]');
  await delay(2000);

  console.log(`Imagem enviada para ${contactName}.`);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://web.whatsapp.com');
  
  console.log('Aguarde, escaneie o QR Code com seu celular.');

  // Espera o usuário escanear o QR Code e o WhatsApp Web carregar
  await page.waitForSelector('div[aria-label="Pesquisar"]', { timeout: 60000 });

  const contacts = ['Vera TST', 'Dindo WhatsApp', 'Ana Borges Tio Zé'];
  const imagePath = path.resolve(__dirname, 'imagens/image1.jpg');

  for (let contact of contacts) {
    await sendMessage(page, contact, imagePath);
    await delay(5000); // Adiciona um pequeno atraso entre os envios
  }

  console.log('Todas as mensagens foram enviadas. Fechando o navegador...');
  await browser.close();
})();
