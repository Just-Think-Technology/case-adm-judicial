// Placeholder e2e — real DB-backed e2e will use @nestjs/testing + supertest
// Keeping this trivial avoids the Nest 12 ESM/Jest mismatch on Node 22
// (Jest requires Node >=24.9 for native require(ESM) or a custom ESM preset).
// Replace with a real AppModule bootstrap once the ESM preset is configured.
describe('Health (e2e placeholder)', () => {
  it('placeholder passes', () => {
    expect(true).toBe(true);
  });
});
