// Shared auth helpers backed by localStorage. Token is set by /login.
const Auth = {
  getToken() {
    return localStorage.getItem('authToken');
  },
  getUser() {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.reload();
  },
  renderTopbarLinks(el) {
    const user = Auth.getUser();
    if (user) {
      el.innerHTML =
        `<span>${user.name} (${user.role})</span> <a href="#" id="logoutLink">Log out</a>`;
      el.querySelector('#logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
      });
    } else {
      el.innerHTML = `<a href="/login?next=${encodeURIComponent(window.location.pathname)}">Log in</a>`;
    }
  },
};
