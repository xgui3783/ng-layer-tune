import { newSpecPage } from '@stencil/core/testing';
import { NgLayerTune } from '../ng-layer-tune';

describe('ng-layer-tune', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [NgLayerTune],
      html: `<ng-layer-tune></ng-layer-tune>`,
    });
    expect(page.root).toBeTruthy()
    // expect(page.root).toEqualHtml(`
    //   <ng-layer-tune>
    //     <mock:shadow-root>
    //       <slot></slot>
    //     </mock:shadow-root>
    //   </ng-layer-tune>
    // `);
  });
});
