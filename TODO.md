# Removal Plan: Blog, Pages, Categories, Employees

## Step 1: Delete Files (14 files)
- [x] blog.html, pages.html, categories.html, employees.html
- [x] attendance.html, payroll.html, reports.html, profile.html (redirect pages)
- [x] js/pages.js, js/categories.js, js/employees.js
- [x] css/pages.css, css/categories.css, css/employees.css

## Step 2: Edit index.html
- [ ] Remove sidebar links (Pages, Blog, Categories)
- [ ] Remove Dashboard stats cards (Total Pages, Blog Posts)
- [ ] Remove Quick Stats (Draft Pages, Published Posts, Categories, Tags)
- [ ] Remove Recent Pages table
- [ ] Remove "Top Categories" widget
- [ ] Remove Quick Links to blog/pages
- [ ] Update inline script to remove cmsPages/cmsPosts/cmsCategories/cmsTags references
- [ ] Update welcome section

## Step 3: Edit media.html
- [ ] Remove sidebar links (Pages, Blog, Categories)

## Step 4: Edit users.html
- [ ] Remove sidebar links (Pages, Blog, Categories)

## Step 5: Edit settings.html
- [ ] Remove sidebar links (Pages, Blog, Categories)
- [ ] Remove "Blog Notifications" toggle

## Step 6: Edit js/dashboard.js
- [ ] Remove references to pages, posts, categories, tags
- [ ] Update charts to only show Media & Users
- [ ] Remove page/post counter animations

## Step 7: Edit server/server.js
- [ ] Remove "page" and "blog" from notification icon/color maps
- [ ] Remove blog-related notification settings

## Step 8: Edit css/sidebar.css
- [ ] Update nth-child animation delays (remove 3 items)
