import { test, expect } from '@playwright/test';

for (const width of [320, 390]) {
  for (const textScale of [100, 200]) {
    test(`quick capture stays readable at ${width}px with ${textScale}% text`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 844 });
      // Hold the request to inspect the longer pending label without timing assumptions.
      let rejectCapture: (() => Promise<void>) | undefined;
      await page.route('**/api/inbox', (route) => {
        rejectCapture = () => route.fulfill({ status: 500, json: {} });
      });
      await page.goto('/');
      // Enlarge actual text/rem sizing, rather than changing pixel density.
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${scale}%`;
      }, textScale);
      const capture = page.getByRole('form', { name: 'Quick capture' });
      const input = capture.getByLabel('Capture title');
      const button = capture.getByRole('button');
      await input.fill('Idea');

      async function expectReadableControls(state: string) {
        await expect(input).toHaveValue('Idea');
        await expect(input).toBeInViewport();
        await expect(button).toBeInViewport();
        const measurements = await capture.evaluate((form) => {
          const field = form.querySelector('input')!;
          const submit = form.querySelector('button')!;
          const style = getComputedStyle(field);
          const context = document.createElement('canvas').getContext('2d')!;
          context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          return {
            usableTextWidth:
              field.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
            requiredTextWidth: context.measureText(field.value).width + 2,
            controls: [field, submit].map((control) => {
              const rect = control.getBoundingClientRect();
              return { left: rect.left, right: rect.right, height: rect.height };
            }),
            buttonClientWidth: submit.clientWidth,
            buttonScrollWidth: submit.scrollWidth,
            buttonClientHeight: submit.clientHeight,
            buttonScrollHeight: submit.scrollHeight,
            viewportWidth: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
          };
        });
        // Visibility alone passes even when padding consumes the entire input width.
        expect(measurements.usableTextWidth).toBeGreaterThanOrEqual(measurements.requiredTextWidth);
        for (const control of measurements.controls) {
          expect(control.left).toBeGreaterThanOrEqual(0);
          expect(control.right).toBeLessThanOrEqual(measurements.viewportWidth);
          expect(control.height).toBeGreaterThanOrEqual(44);
        }
        expect(measurements.buttonScrollWidth).toBeLessThanOrEqual(measurements.buttonClientWidth);
        expect(measurements.buttonScrollHeight).toBeLessThanOrEqual(
          measurements.buttonClientHeight,
        );
        expect(measurements.documentWidth).toBeLessThanOrEqual(measurements.viewportWidth);
        await info.attach(`${state}-measurements`, {
          body: JSON.stringify(measurements, null, 2),
          contentType: 'application/json',
        });
        await capture.screenshot({ path: info.outputPath(`${state}.png`) });
      }

      await expectReadableControls('ready');
      await input.press('Tab');
      await expect(button).toBeFocused();
      await button.press('Enter');
      await expect(button).toHaveText('Capturing…');
      await expect(button).toBeDisabled();
      await expect(input).toBeDisabled();
      await expectReadableControls('capturing');
      await expect.poll(() => typeof rejectCapture).toBe('function');
      if (!rejectCapture) throw new Error('Capture request was not intercepted');
      await rejectCapture();
      await expect(capture.getByRole('alert')).toBeVisible();
      await expect(button).toBeEnabled();
      await expect(input).toBeEnabled();
      await expectReadableControls('retained-draft');
    });
  }
}
