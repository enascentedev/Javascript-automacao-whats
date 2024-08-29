const puppeteer = require('puppeteer');
const path = require('path');

// Função para aguardar um tempo determinado
function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time);
  });
}

async function sendMessage(contactName, imagePath) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://web.whatsapp.com');
  
  console.log('Aguarde, escaneie o QR Code com seu celular.');

  // Aguarda o campo de pesquisa
  await page.waitForSelector('div[aria-label="Pesquisar"]', { timeout: 60000 });
  await delay(5000);

  console.log(`Buscando contato: ${contactName}`);
  // Busca pelo contato
  await page.type('div[aria-label="Pesquisar"]', contactName);
  await delay(2000);

  // Seleciona o contato
  const contact = await page.$(`span[title='${contactName}']`);
  if (contact) {
    await contact.click();
    console.log(`Contato ${contactName} selecionado.`);
  } else {
    console.log(`Contato "${contactName}" não encontrado.`);
    await browser.close();
    return;
  }

  // Espera a janela de conversa carregar
  await page.waitForSelector('div[aria-placeholder="Digite uma mensagem"]', { timeout: 60000 });
  console.log('Janela de conversa carregada.');

  // Aguarda até que o botão de adicionar esteja disponível e clica nele
  await page.waitForSelector('span[data-icon="plus"]', { timeout: 60000 });
  console.log('Clicando no botão de adicionar...');
  await page.click('span[data-icon="plus"]');
  await delay(1000);

  // Aguarda e clica na opção "Fotos e vídeos"
  await page.waitForSelector('li[data-animate-dropdown-item="true"]', { timeout: 60000 });
  console.log('Clicando na opção "Fotos e vídeos"...');
  await page.click('li[data-animate-dropdown-item="true"]');
  await delay(1000);

  console.log(`Tentando enviar imagem de ${imagePath}`);
  
  // Envia a imagem diretamente ao input file
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    // Garante que o input de arquivo seja clicável
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

  await browser.close();
}

// Exemplo de uso
const contacts = ['Vera TST', 'Dindo WhatsApp', 'Ana Borges Tio Zé'];
const imagePath = path.resolve(__dirname, 'imagens/image1.jpg');  // Caminho dentro do projeto

// Usar for...of para garantir que as mensagens sejam enviadas em sequência
(async () => {
  for (let contact of contacts) {
    await sendMessage(contact, imagePath);
  }
})();
