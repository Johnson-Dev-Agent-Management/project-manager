import { test, expect } from '@playwright/test';

for (const width of [320, 390]) {
  for (const scale of [100, 200]) {
    test(`accent selection persists and fits at ${width}px with ${scale}% text`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await page.evaluate((value) => {
        document.documentElement.style.fontSize = `${value}%`;
      }, scale);
      const appearance = page.getByText('Appearance', { exact: true });
      const choice = page.getByRole('combobox', { name: 'Accent color' });
      const capture = page.getByRole('button', { name: 'Capture', exact: true });
      const projects = page.getByRole('link', { name: 'Projects', exact: true });
      const blue = await capture.evaluate((element) => getComputedStyle(element).backgroundColor);
      const blueLink = await projects.evaluate((element) => getComputedStyle(element).color);
      await appearance.focus();
      await page.keyboard.press('Enter');
      await expect(choice).toHaveValue('blue');
      await page.keyboard.press('Tab');
      await expect(choice).toBeFocused();
      await choice.selectOption('teal');
      await expect
        .poll(() => capture.evaluate((element) => element.getAnimations().length))
        .toBe(0);
      const teal = await capture.evaluate((element) => getComputedStyle(element).backgroundColor);
      const tealLink = await projects.evaluate((element) => getComputedStyle(element).color);
      expect(teal).not.toBe(blue);
      expect(tealLink).not.toBe(blueLink);
      const geometry = await choice.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          height: box.height,
          document: document.documentElement.scrollWidth,
          viewport: innerWidth,
        };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
      expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
      expect(geometry.height).toBeGreaterThanOrEqual(44);
      await page.screenshot({ path: info.outputPath('teal-preference.png'), fullPage: true });
      await choice.press('Escape');
      await expect(choice).toBeHidden();
      await expect(appearance).toBeFocused();
      await page.reload();
      await expect(capture).toHaveCSS('background-color', teal);
      for (const name of ['Today', 'Inbox', 'Projects']) {
        const link = page.getByRole('link', { name, exact: true });
        await link.click();
        // Move off the link to inspect its selected state rather than its hover color.
        await appearance.focus();
        await page.mouse.move(0, 0);
        await expect(link).toHaveAttribute('aria-current', 'page');
        await expect(link).toHaveCSS('color', tealLink);
      }
      await appearance.press('Enter');
      await expect(choice).toHaveValue('teal');
      await choice.selectOption('blue');
      await expect(capture).toHaveCSS('background-color', blue);
      await choice.press('Escape');
      await page.reload();
      await expect(capture).toHaveCSS('background-color', blue);
      await appearance.click();
      await expect(choice).toHaveValue('blue');
    });
  }
}
