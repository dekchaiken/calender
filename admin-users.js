document.addEventListener('DOMContentLoaded', async () => {
    const hasAccess = await checkAdminAccess();
    if (hasAccess) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        await loadUsers(); // เรียกใช้ loadUsers ในหน้านี้
    }
});