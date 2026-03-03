from playwright.sync_api import sync_playwright
import time
import sys

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to dashboard...")
        page.goto('http://localhost:3000') # Or 5173 depending on the server, but Charlie uses Next.js running on 3000
        
        # Wait for page readiness
        try:
            page.wait_for_load_state('networkidle', timeout=10000)
        except Exception:
            pass
            
        # Log in if needed
        if "login" in page.url:
            print("Logging in...")
            page.fill('input[type="email"]', 'briantoanle@gmail.com')
            page.fill('input[type="password"]', 'Lttt0408!@#')
            page.click('button[type="submit"]')
            try:
                page.wait_for_load_state('networkidle', timeout=10000)
            except Exception:
                pass
                
        print("Current URL after login:", page.url)

        # Wait for dashboard to load
        page.wait_for_selector('text=Good', timeout=10000)
        print("Dashboard loaded.")

        # 1. Add transaction
        print("Testing Add Transaction...")
        # Search for Add Transaction button
        add_btn = page.locator('button[title="Add Transaction"]').first
        if not add_btn.is_visible():
            add_btn = page.locator('text=Add Transaction').first
            
        add_btn.click()
        
        # Wait for modal
        page.wait_for_selector('text=Amount', timeout=5000)
        
        # We need to click on account select drop down first since it's required (but it's a combobox)
        page.locator('button[role="combobox"]').first.click()
        page.locator('div[role="option"]').first.click()

        page.fill('input#amount', '12.34')
        page.fill('input#merchant', 'Test Merchant')
        # Submit transaction
        submit_txn = page.locator('button[type="submit"]')
        if submit_txn.is_visible():
            submit_txn.click()
            
        print("Add transaction form submitted.")
        time.sleep(2)

        # 2. Add Account
        print("Testing Accounts Page loading...")
        page.goto('http://localhost:3000/accounts')
        try:
            page.wait_for_load_state('networkidle', timeout=5000)
        except Exception:
            pass
            
        page.wait_for_selector('text=Connect Bank', timeout=5000)
        print("Accounts page loaded successfully.")
        
        time.sleep(2)

        # 3. Create categories
        print("Testing Create Categories...")
        page.goto('http://localhost:3000/categories')
        try:
            page.wait_for_load_state('networkidle', timeout=5000)
        except Exception:
            pass
            
        print("Clicking New Category...")    
        add_cat_btn = page.locator('button:has-text("New Category")').first
        if add_cat_btn.is_visible():
            add_cat_btn.click()
            page.fill('input[placeholder="e.g. Groceries"]', 'Test Category')
            page.locator('button:has-text("Add")').first.click()
            print("Category creation form submitted.")
        else:
            print("New Category button not found.")

        browser.close()
        print("All tests completed.")

if __name__ == "__main__":
    run()
