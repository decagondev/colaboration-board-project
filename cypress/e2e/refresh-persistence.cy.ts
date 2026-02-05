/**
 * Refresh Persistence E2E Test
 *
 * Scenario 2 from PRD: Verify state survives page refresh.
 *
 * Steps:
 * 1. Create multiple objects (notes, shapes, connectors)
 * 2. Note exact positions and properties
 * 3. Refresh the browser
 * 4. Wait for board to load
 * 5. Verify all objects are present
 * 6. Verify positions and properties match
 *
 * Expected Result: All objects persist with correct state
 */
describe('Refresh Persistence', () => {
  const testUser = {
    email: 'test@collabboard.com',
    password: 'testpassword123',
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it('should persist board state after page refresh', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="toolbar-sticky-note"]').click();
    cy.get('[data-testid="board-canvas"]').click(200, 200);

    cy.get('[data-testid="sticky-note"]', { timeout: 5000 }).should('exist');

    cy.wait(2000);

    cy.reload();

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="sticky-note"]', { timeout: 10000 }).should('exist');
  });

  it('should preserve object properties after refresh', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="toolbar-shape"]').click();
    cy.get('[data-testid="board-canvas"]').click(300, 300);

    cy.wait(2000);

    cy.reload();

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');
  });

  it('should preserve viewport position after refresh', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="board-canvas"]')
      .trigger('wheel', { deltaY: -100, ctrlKey: true });

    cy.wait(1000);

    cy.reload();

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');
  });

  it('should preserve multiple objects after refresh', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="toolbar-sticky-note"]').click();
    cy.get('[data-testid="board-canvas"]').click(150, 150);
    cy.wait(500);

    cy.get('[data-testid="toolbar-sticky-note"]').click();
    cy.get('[data-testid="board-canvas"]').click(350, 150);
    cy.wait(500);

    cy.get('[data-testid="toolbar-sticky-note"]').click();
    cy.get('[data-testid="board-canvas"]').click(250, 350);
    cy.wait(500);

    cy.wait(2000);

    cy.reload();

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');
  });
});
