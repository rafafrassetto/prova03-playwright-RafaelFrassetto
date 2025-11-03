// 'test', 'expect', 'Page', e 'Request' vêm de @playwright/test
import { test, expect, Page, Request } from '@playwright/test';
// Apenas 'ai' vem de @zerostep/playwright
import { ai } from '@zerostep/playwright';
// ---------------------------------------------------

import { faker } from '@faker-js/faker';
import ContactPage from '../support/pages/ContactPage';

let contactPage: ContactPage;
const pageUrl =
  'https://techshop.wuaze.com/resources/views/RafaelFrassettoPereira-JoaoGabrielRosso-JoaoAcordi-LuizMiguel-Apresentacao-A3.html?i=1';

test.beforeEach(async ({ page }: { page: Page }) => {
  contactPage = new ContactPage(page);
  // Adicionamos um timeout maior para o 'goto'
  await contactPage.visit();
  await expect(page).toHaveTitle('Formulário de Contato');
});

/**
 * TESTE 1: Playwright Padrão (Happy Path)
 */
test('deve preencher e enviar o formulário com sucesso (Playwright Padrão)', async ({
  page
}: {
  page: Page;
}) => {
  const testData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: faker.lorem.sentence(5),
    message: faker.lorem.paragraph()
  };

  await contactPage.fillContactForm(
    testData.name,
    testData.email,
    testData.subject,
    testData.message
  );

  const [request] = await Promise.all([
    page.waitForRequest((req: Request) => req.method() === 'POST'),
    contactPage.submitForm()
  ]);

  expect(request.method()).toBe('POST');

  // MUDANÇA: Corrigindo como lemos os dados do POST
  const postDataString = request.postData();
  expect(postDataString).toBeTruthy(); // Verifica se postData não é nulo

  const postData = new URLSearchParams(postDataString!);
  expect(postData.get('nome')).toBe(testData.name);
  expect(postData.get('email')).toBe(testData.email);
  // -------------------------------------------------
});

/**
 * TESTE 2: Zerostep AI
 */
test('deve preencher e enviar o formulário com sucesso (Zerostep AI)', async ({
  page
}: {
  page: Page;
}) => {
  const testData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: 'Teste de Assunto via AI',
    message: 'Esta é uma mensagem de teste enviada pela Zerostep AI.'
  };

  // Passamos 'test: test' para a função 'ai'
  await ai(`Preencha o campo "Nome Completo" com "${testData.name}"`, { page, test: test });
  await ai(`Preencha o campo "Seu Melhor Email" com "${testData.email}"`, {
    page,
    test: test
  });
  await ai(`Preencha o campo "Assunto" com "${testData.subject}"`, { page, test: test });
  await ai(`Preencha o campo "Mensagem" com "${testData.message}"`, {
    page,
    test: test
  });

  const [request] = await Promise.all([
    page.waitForRequest((req: Request) => req.method() === 'POST'),
    ai('Clique no botão "Enviar"', { page, test: test })
  ]);

  expect(request.method()).toBe('POST');

  // MUDANÇA: Corrigindo como lemos os dados do POST
  const postDataString = request.postData();
  expect(postDataString).toBeTruthy(); // Verifica se postData não é nulo

  const postData = new URLSearchParams(postDataString!);
  expect(postData.get('nome')).toBe(testData.name);
  expect(postData.get('assunto')).toBe(testData.subject);
  // -------------------------------------------------
});

/**
 * TESTE 3: Playwright Padrão (Validação)
 */
test('deve mostrar erro de validação ao tentar enviar campos obrigatórios vazios', async ({
  page
}: {
  page: Page;
}) => {
  await contactPage.submitForm();

  const isNomeValid = await contactPage.nameInput.evaluate(
    el => (el as HTMLInputElement).validity.valid
  );
  expect(isNomeValid).toBe(false);

  await expect(page).toHaveURL(pageUrl);
});