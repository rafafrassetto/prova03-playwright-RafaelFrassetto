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

// A importação correta de 'test' (acima) já resolve os erros de tipo 'any' aqui
test.beforeEach(async ({ page }: { page: Page }) => {
  contactPage = new ContactPage(page);
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

  // Adicionamos o tipo 'Request' ao 'req' para resolver o erro 'any'
  const [request] = await Promise.all([
    page.waitForRequest((req: Request) => req.method() === 'POST'),
    contactPage.submitForm()
  ]);

  expect(request.method()).toBe('POST');
  const postData = request.postDataJSON();
  expect(postData.nome).toBe(testData.name);
  expect(postData.email).toBe(testData.email);
});

/**
 * TESTE 2: Zerostep AI
 */
// A tipagem de 'page' é adicionada aqui também
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

  // MUDANÇA FINAL: Passamos 'test: test'
  // O primeiro 'test' é a propriedade que a função 'ai' espera.
  // O segundo 'test' é a função que importamos no topo do arquivo.
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
  // ---------------------------------------------------

  const [request] = await Promise.all([
    page.waitForRequest((req: Request) => req.method() === 'POST'),
    // Corrigido aqui também
    ai('Clique no botão "Enviar"', { page, test: test })
  ]);

  expect(request.method()).toBe('POST');
  const postData = request.postDataJSON();
  expect(postData.nome).toBe(testData.name);
  expect(postData.assunto).toBe(testData.subject);
});

/**
 * TESTE 3: Playwright Padrão (Validação)
 */
// A tipagem de 'page' é adicionada aqui também
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