// tests/weekly-calendar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('WeeklyCalendar', () => {
  test('should display basic layout correctly', async ({ page }) => {
    await page.goto('/');
    
    // 验证标题和年份选择器
    await expect(page.locator('h1')).toContainText('Yeeks');
    await expect(page.locator('p')).toContainText('Your year in weeks');
    
    // 验证表格布局
    const table = await page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should show week details on hover', async ({ page }) => {
    await page.goto('/');
    
    // 选择 2025 年
    await page.locator('button.text-2xl').click();
    await page.locator('button.w-full.px-6.py-2:has-text("2025")').click();
    
    // 悬停在第一周格子上
    const weekCell = await page.locator('td').first();
    await weekCell.hover();
    
    // 验证日期范围显示和内容
    const dateRange = await weekCell.locator('div.opacity-0.group-hover\\:opacity-100');
    await expect(dateRange).toBeVisible();
    await expect(dateRange).toHaveText('1.1-1.5');
  });

  test('should open note modal on week click', async ({ page }) => {
    await page.goto('/');
    
    // 点击任意周格子
    await page.locator('td').first().click();
    
    // 验证模态框显示
    const modal = await page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
    
    // 验证模态框内容
    await expect(modal.locator('text=Week 1')).toBeVisible();
    await expect(modal.locator('textarea')).toBeVisible();
  });

  test('should save and persist notes', async ({ page }) => {
    await page.goto('/');
    
    // 点击第一周
    await page.locator('td').first().click();
    
    // 输入笔记内容
    const testNote = 'Test note content';
    await page.locator('textarea').fill(testNote);
    
    // 等待自动保存
    await page.waitForTimeout(600);
    
    // 关闭模态框（使用更精确的选择器）
    await page.locator('button.text-gray-400.hover\\:text-gray-600').click();
    
    // 验证笔记标记（蓝色边框）
    const weekCell = await page.locator('td').first();
    await expect(weekCell).toHaveClass(/ring-2 ring-blue-500/);
    
    // 重新打开验证内容保存
    await weekCell.click();
    await expect(page.locator('textarea')).toHaveValue(testNote);
  });

  test('should show correct week status based on current date', async ({ page }) => {
    await page.goto('/');
    
    // 至少应该有一个当前周（灰色背景）
    const currentWeek = await page.locator('td.bg-gray-200');
    await expect(currentWeek).toBeVisible();
    
    // 验证至少有一个过去的周（深色背景）
    const pastWeeks = await page.locator('td.bg-gray-600').all();
    expect(pastWeeks.length).toBeGreaterThan(0);
  });

  test('should open recap view from menu', async ({ page }) => {
    await page.goto('/');
    
    // 点击菜单按钮
    await page.locator('button.p-2.hover\\:bg-gray-100').click();
    
    // 点击 Recap 选项
    await page.locator('text=Recap').click();
    
    // 验证回顾视图显示
    const recapView = await page.locator('text=/\\d{4} Recap/');
    await expect(recapView).toBeVisible();
    
    // 验证回顾内容
    const weekEntries = await page.locator('div:has-text("Week")').all();
    expect(weekEntries.length).toBeGreaterThan(0);
  });
});