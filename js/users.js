/* ==========================================================
   BBIPL CMS
   users.js - User Management
========================================================== */

"use strict";

const UserManager = {

    users: [],
    filteredUsers: [],
    currentPage: 1,
    rowsPerPage: 10,
    deleteUserId: null,

    init() {
        this.loadUsers();
        this.renderUsers();
        this.updateStatistics();
    },

    loadUsers() {
        const data = localStorage.getItem("cmsUsers");
        if (data) {
            this.users = JSON.parse(data);
        } else {
            // Default users
            this.users = [
                {
                    id: "USR001",
                    name: "Administrator",
                    email: "admin@bbipl.com",
                    phone: "+91 9876543210",
                    role: "Admin",
                    bio: "Site Administrator",
                    status: "Active",
                    joinedDate: "2026-01-01",
                    photo: "images/profile.png"
                }
            ];
            localStorage.setItem("cmsUsers", JSON.stringify(this.users));
        }
        this.filteredUsers = [...this.users];
    },

    saveUsers() {
        localStorage.setItem("cmsUsers", JSON.stringify(this.users));
    },

    generateUserId() {
        const input = document.getElementById("userId");
        if (!input) return;
        let highest = 0;
        this.users.forEach(u => {
            const num = parseInt(u.id.replace("USR", ""));
            if (num > highest) highest = num;
        });
        input.value = "USR" + String(highest + 1).padStart(3, "0");
    },

    statusClass(status) {
        switch (status) {
            case "Active": return "active";
            case "Inactive": return "inactive";
            case "Suspended": return "leave";
            default: return "active";
        }
    },

    renderUsers() {
        const table = document.getElementById("userTable");
        if (!table) return;
        table.innerHTML = "";

        if (this.filteredUsers.length === 0) {
            table.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;">No Users Found</td></tr>`;
            return;
        }

        this.filteredUsers.forEach((user, index) => {
            table.innerHTML += `
            <tr>
                <td><img src="${user.photo || 'images/profile.png'}" class="user-photo" alt="User"></td>
                <td>${user.id}</td>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td><span class="status ${this.statusClass(user.status)}">${user.status}</span></td>
                <td>${user.role}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-index="${index}"><i class="fa fa-edit"></i></button>
                        <button class="delete-btn" data-index="${index}"><i class="fa fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        });

        this.attachTableEvents();
    },

updateStatistics() {
        const total = this.users.length;
        const active = this.users.filter(u => u.status === "Active").length;
        const admins = this.users.filter(u => u.role === "Admin").length;
        const editors = this.users.filter(u => u.role === "Editor" || u.role === "Author").length;
        const regUsers = this.users.filter(u => u.role === "User").length;

        const elTotal = document.getElementById("totalUsers");
        const elActive = document.getElementById("activeUsers");
        const elAdmins = document.getElementById("adminCount");
        const elEditors = document.getElementById("editorCount");

        if (elTotal) elTotal.textContent = total;
        if (elActive) elActive.textContent = active;
        if (elAdmins) elAdmins.textContent = admins;
        if (elEditors) elEditors.textContent = editors + regUsers;
    },

    openAddModal() {
        const modal = document.getElementById("userModal");
        const form = document.getElementById("userForm");
        if (!modal || !form) return;
        form.reset();
        document.getElementById("modalTitle").textContent = "Add User";
        document.getElementById("userIndex").value = "";
        this.generateUserId();
        modal.classList.add("show");
    },

    closeModal() {
        const modal = document.getElementById("userModal");
        if (modal) modal.classList.remove("show");
    },

    validateForm() {
        const fields = ["userName", "userEmail", "userRole"];
        for (const id of fields) {
            const input = document.getElementById(id);
            if (!input || input.value.trim() === "") {
                alert("Please fill all required fields.");
                if (input) input.focus();
                return false;
            }
        }
        const email = document.getElementById("userEmail").value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Invalid Email Address");
            return false;
        }
        return true;
    },

    readImage(file) {
        return new Promise((resolve) => {
            if (!file) { resolve("images/profile.png"); return; }
            const reader = new FileReader();
            reader.onload = function (e) { resolve(e.target.result); };
            reader.readAsDataURL(file);
        });
    },

    saveUser() {
        if (!this.validateForm()) return;

        // Check for duplicate email
        const email = document.getElementById("userEmail").value.trim().toLowerCase();
        const emailExists = this.users.some(u => u.email.toLowerCase() === email);
        if (emailExists) {
            if (window.showToast) showToast("A user with this email already exists", "error");
            else alert("A user with this email already exists.");
            return;
        }

        const imageFile = document.getElementById("userPhoto").files[0];
        return this.readImage(imageFile).then(image => {
            const user = {
                id: document.getElementById("userId").value,
                name: document.getElementById("userName").value.trim(),
                email: document.getElementById("userEmail").value.trim(),
                phone: document.getElementById("userPhone").value.trim(),
                role: document.getElementById("userRole").value,
                status: document.getElementById("userStatus").value,
                bio: document.getElementById("userBio").value.trim(),
                joinedDate: new Date().toISOString().split("T")[0],
                photo: image,
                password: ""
            };

            this.users.push(user);
            this.filteredUsers = [...this.users];
            this.saveUsers();
            this.renderUsers();
            this.updateStatistics();
            this.updateRecordCount();
            this.closeModal();
            if (window.showToast) showToast("User Added Successfully");
            return true;
        });
    },

    editUser(index) {
        const user = this.users[index];
        if (!user) return;
        document.getElementById("modalTitle").textContent = "Edit User";
        document.getElementById("userIndex").value = index;
        document.getElementById("userId").value = user.id;
        document.getElementById("userName").value = user.name;
        document.getElementById("userEmail").value = user.email;
        document.getElementById("userPhone").value = user.phone || '';
        document.getElementById("userRole").value = user.role;
        document.getElementById("userStatus").value = user.status;
        document.getElementById("userBio").value = user.bio || '';
        document.getElementById("userModal").classList.add("show");
    },

    async updateUser() {
        if (!this.validateForm()) return;
        const index = Number(document.getElementById("userIndex").value);
        const imageFile = document.getElementById("userPhoto").files[0];
        let photo = this.users[index].photo;
        if (imageFile) photo = await this.readImage(imageFile);

        // Update user in the master users array
        this.users[index] = {
            id: document.getElementById("userId").value,
            name: document.getElementById("userName").value.trim(),
            email: document.getElementById("userEmail").value.trim(),
            phone: document.getElementById("userPhone").value.trim(),
            role: document.getElementById("userRole").value,
            status: document.getElementById("userStatus").value,
            bio: document.getElementById("userBio").value.trim(),
            joinedDate: this.users[index].joinedDate,
            photo: photo,
            password: this.users[index].password || ""
        };

        // Re-sync filtered users from updated master list
        this.filteredUsers = [...this.users];
        this.saveUsers();
        this.renderUsers();
        this.updateStatistics();
        this.updateRecordCount();
        this.closeModal();
        if (window.showToast) showToast("User Updated Successfully");
    },

    openDeleteModal(id) {
        this.deleteUserId = id;
        document.getElementById("deleteModal").classList.add("show");
    },

    closeDeleteModal() {
        this.deleteUserId = null;
        document.getElementById("deleteModal").classList.remove("show");
    },

    deleteUser() {
        if (!this.deleteUserId) return;
        this.users = this.users.filter(u => u.id !== this.deleteUserId);
        this.filteredUsers = [...this.users];
        this.saveUsers();
        this.renderUsers();
        this.updateStatistics();
        this.updateRecordCount();
        this.closeDeleteModal();
        if (window.showToast) showToast("User Deleted Successfully");
    },

    attachTableEvents() {
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.onclick = () => {
                const row = button.closest("tr");
                const id = row.children[1].textContent.trim();
                const index = this.users.findIndex(u => u.id === id);
                if (index !== -1) this.editUser(index);
            };
        });
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.onclick = () => {
                const row = button.closest("tr");
                const id = row.children[1].textContent.trim();
                this.openDeleteModal(id);
            };
        });
    },

    filterUsers() {
        const searchText = (document.getElementById("userSearch")?.value || "").toLowerCase().trim();
        const role = document.getElementById("roleFilter")?.value || "all";
        const status = document.getElementById("statusFilter")?.value || "all";

        this.filteredUsers = this.users.filter(user => {
            const searchMatch = user.name.toLowerCase().includes(searchText) ||
                user.email.toLowerCase().includes(searchText) ||
                user.id.toLowerCase().includes(searchText);
            const roleMatch = role === "all" ? true : user.role === role;
            const statusMatch = status === "all" ? true : user.status === status;
            return searchMatch && roleMatch && statusMatch;
        });
        this.renderUsers();
        this.updateRecordCount();
    },

    updateRecordCount() {
        const record = document.getElementById("recordCount");
        if (record) record.textContent = this.filteredUsers.length;
    },

    refresh() {
        const searchBox = document.getElementById("userSearch");
        const roleFilter = document.getElementById("roleFilter");
        const statusFilter = document.getElementById("statusFilter");
        if (searchBox) searchBox.value = "";
        if (roleFilter) roleFilter.value = "all";
        if (statusFilter) statusFilter.value = "all";
        this.filteredUsers = [...this.users];
        this.renderUsers();
        this.updateStatistics();
        this.updateRecordCount();
        if (window.showToast) showToast("User list refreshed.");
    },

    initialize() {
        this.loadUsers();
        this.renderUsers();
        this.updateStatistics();
        this.updateRecordCount();
        this.generateUserId();

        // Hide loader
        setTimeout(() => {
            const loader = document.getElementById("loader");
            if (loader) { loader.style.opacity = "0"; setTimeout(() => { loader.style.display = "none"; }, 500); }
        }, 600);
    }
};

/* ==========================================
   EVENT LISTENERS
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    UserManager.initialize();

    const addBtn = document.getElementById("addUserBtn");
    const closeBtn = document.getElementById("closeUserModal");
    const closeView = document.getElementById("closeViewModal");
    const cancelDelete = document.getElementById("cancelDelete");
    const confirmDelete = document.getElementById("confirmDelete");
    const form = document.getElementById("userForm");
    const refreshBtn = document.getElementById("refreshUsers");
    const searchBox = document.getElementById("userSearch");
    const roleFilter = document.getElementById("roleFilter");
    const statusFilter = document.getElementById("statusFilter");

    if (addBtn) addBtn.addEventListener("click", () => UserManager.openAddModal());
    if (closeBtn) closeBtn.addEventListener("click", () => UserManager.closeModal());
    if (closeView) closeView.onclick = () => UserManager.closeViewModal?.();
    if (cancelDelete) cancelDelete.onclick = () => UserManager.closeDeleteModal();
    if (confirmDelete) confirmDelete.onclick = () => UserManager.deleteUser();
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const index = document.getElementById("userIndex").value;
            if (index === "") UserManager.saveUser();
            else UserManager.updateUser();
        });
    }
    if (searchBox) searchBox.addEventListener("input", () => UserManager.filterUsers());
    if (roleFilter) roleFilter.addEventListener("change", () => UserManager.filterUsers());
    if (statusFilter) statusFilter.addEventListener("change", () => UserManager.filterUsers());
    if (refreshBtn) refreshBtn.addEventListener("click", () => UserManager.refresh());

    // Keyboard shortcuts
    document.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); UserManager.openAddModal(); }
        if (e.ctrlKey && e.key.toLowerCase() === "f") { e.preventDefault(); document.getElementById("userSearch")?.focus(); }
        if (e.key === "Escape") { UserManager.closeModal(); UserManager.closeDeleteModal(); }
    });

    // Close modals on outside click
    window.addEventListener("click", function (event) {
        ["userModal", "deleteModal"].forEach(id => {
            const modal = document.getElementById(id);
            if (modal && event.target === modal) modal.classList.remove("show");
        });
    });
});

window.UserManager = UserManager;
