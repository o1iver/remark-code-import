const codeImport = require('./');
const remark = require('remark');
const path = require('path');

const input = q => `
\`\`\`js file=./__fixtures__/say-#-hi.js${q}
\`\`\`
`;

test('Basic file import', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input(''),
        path: path.resolve('test.md'),
      })
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js
    console.log('Hello remark-code-import!');
    console.log('This is another line...');
    console.log('This is the last line');
    console.log('Oops, here is is another');

    // [[start:myFunction]]
    function myFunction() {
      console.log('this just did something cool');
    }
    // [[end:myFunction]]

    function mySecondFunction() {}

    // [[start:w@ei#dtag$pacEs]]
    function myThirdFunction() {
      console.log('hey there!!');
    }
    // [[end:w@ei#dtag$pacEs]]

    console.log('This is actually the last line');
    \`\`\`
    "
  `);
});

test('File import using line numbers', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input(`#L2-L3`),
        path: path.resolve('test.md'),
      })
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#L2-L3
    console.log('This is another line...');
    console.log('This is the last line');
    \`\`\`
    "
  `);
});

test('File import using single line number', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input('#L1'),
        path: path.resolve('test.md'),
      })
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#L1
    console.log('Hello remark-code-import!');
    \`\`\`
    "
  `);
});

test("Only following lines (e.g. #-L10) doesn't work", () => {
  expect(() => {
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input('#-L2'),
        path: path.resolve('test.md'),
      })
      .toString();
  }).toThrow();
});

test('File import using single line number and following lines', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input('#L2-'),
        path: path.resolve('test.md'),
      })
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#L2-
    console.log('This is another line...');
    console.log('This is the last line');
    console.log('Oops, here is is another');

    // [[start:myFunction]]
    function myFunction() {
      console.log('this just did something cool');
    }
    // [[end:myFunction]]

    function mySecondFunction() {}

    // [[start:w@ei#dtag$pacEs]]
    function myThirdFunction() {
      console.log('hey there!!');
    }
    // [[end:w@ei#dtag$pacEs]]

    console.log('This is actually the last line');
    \`\`\`
    "
  `);
});

test('File import using tag', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input('#[myFunction]'),
        path: path.resolve('test.md'),
      })
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#[myFunction]
    function myFunction() {
      console.log('this just did something cool');
    }
    \`\`\`
    "
  `);
});

test('File import using weird tag', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input('#[w@ei#dtag$pacEs]'),
        path: path.resolve('test.md'),
      })
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#[w@ei#dtag$pacEs]
    function myThirdFunction() {
      console.log('hey there!!');
    }
    \`\`\`
    "
  `);
});

test('File import using unknown tag', () => {
  expect(() => {
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input('#[idontknowwhatthisis]'),
        path: path.resolve('test.md'),
      })
      .toString();
  }).toThrow();
});

test('File import using tag with spaces', () => {
  expect(() => {
    remark()
      .use(codeImport, {})
      .processSync({
        contents: input('#[tag with spaces]'),
        path: path.resolve('test.md'),
      })
      .toString();
  }).toThrow();
});
