import { test, expect } from '@playwright/test';
import { ai } from '@zerostep/playwright';
import { faker } from '@faker-js/faker'; // Usaremos o faker para gerar dados
import ContactPage from '../support/pages/ContactPage';

// Variável para a Page Object
let contactPage: ContactPage;
const pageUrl =
  'https://techshop.wuaze.com/resources/views/RafaelFrassettoPereira-JoaoGabrielRosso-JoaoAcordi-LuizMiguel-Apresentacao-A3.html?i=1';

test.beforeEach(async ({ page }) => {
  // Inicializa a Page Object e visita a URL antes de cada teste
  contactPage = new ContactPage(page);
  await contactPage.visit();
  await expect(page).toHaveTitle('Formulário de Contato');
});

/**
 * TESTE 1: Playwright Padrão (Happy Path)
 * Preenche e envia o formulário com dados válidos.
 */
test('deve preencher e enviar o formulário com sucesso (Playwright Padrão)', async ({
  page
}) => {
  const testData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: faker.lorem.sentence(5),
    message: faker.lorem.paragraph()
  };

  // Preenche o formulário
  await contactPage.fillContactForm(
    testData.name,
    testData.email,
    testData.subject,
    testData.message
  );

  // O seu formulário tem action="#", então ele apenas recarrega a página.
  // Vamos esperar por uma requisição POST que é disparada ao clicar.
  const [request] = await Promise.all([
    page.waitForRequest(req => req.method() === 'POST'),
    contactPage.submitForm()
  ]);

  // Verifica se a requisição foi feita
  expect(request.method()).toBe('POST');
  
  // Verifica se os dados enviados estão corretos
  const postData = request.postDataJSON();
  expect(postData.nome).toBe(testData.name);
  expect(postData.email).toBe(testData.email);
});

/**
 * TESTE 2: Zerostep AI
 * Preenche e envia o formulário usando comandos de IA.
 */
test('deve preencher e enviar o formulário com sucesso (Zerostep AI)', async ({
  page
}) => {
  const testData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: 'Teste de Assunto via AI',
    message: 'Esta é uma mensagem de teste enviada pela Zerostep AI.'
  };

  // Use a Zerostep AI para preencher os campos
  // O token ZEROSTEP_TOKEN será pego das suas GitHub Secrets, como configurado no .yml
  await ai(page, `Preencha o campo "Nome Completo" com "${testData.name}"`);
  await ai(page, `Preencha o campo "Seu Melhor Email" com "${testData.email}"`);
  await ai(page, `Preencha o campo "Assunto" com "${testData.subject}"`);
  await ai(
    page,
    `Preencha o campo "Mensagem" com "${testData.message}"`
  );

  // Espera pela requisição POST ao clicar
  const [request] = await Promise.all([
    page.waitForRequest(req => req.method() === 'POST'),
    ai(page, 'Clique no botão "Enviar"') // Clica usando AI
  ]);

  // Verifica se a requisição foi feita
  expect(request.method()).toBe('POST');

  // Verifica se os dados enviados estão corretos
  const postData = request.postDataJSON();
  expect(postData.nome).toBe(testData.name);
  expect(postData.assunto).toBe(testData.subject);
});

/**
 * TESTE 3: Playwright Padrão (Validação)
 * Tenta enviar o formulário vazio e verifica a validação HTML5.
 */
test('deve mostrar erro de validação ao tentar enviar campos obrigatórios vazios', async ({
  page
}) => {
  // Tenta enviar o formulário vazio
  await contactPage.submitForm();

  // Verifica a validação do HTML5 no primeiro campo (Nome)
  // O Playwright pode checar a "validity state" do elemento
  const isNomeValid = await contactPage.nameInput.evaluate(
    el => (el as HTMLInputElement).validity.valid
  );
  
  // Esperamos que o campo NÃO seja válido, pois é 'required'
  expect(isNomeValid).toBe(false);

  // Também podemos checar se a URL não mudou, pois o envio foi bloqueado
  await expect(page).toHaveURL(pageUrl);
});