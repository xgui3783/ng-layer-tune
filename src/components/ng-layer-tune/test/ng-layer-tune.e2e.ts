import { newE2EPage } from '@stencil/core/testing';

describe('ng-layer-tune', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ng-layer-tune></ng-layer-tune>');

    const element = await page.find('ng-layer-tune');
    expect(element).toHaveClass('hydrated');
  });
});
