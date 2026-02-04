describe('Home Page', () => {
  it('displays the CollabBoard header', () => {
    cy.visit('/');
    cy.contains('h1', 'CollabBoard').should('be.visible');
  });

  it('displays the welcome message', () => {
    cy.visit('/');
    cy.contains('Welcome to CollabBoard').should('be.visible');
  });
});
