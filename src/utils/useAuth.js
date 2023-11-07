// authGuard.js
export const useAuth = () => {
  const token = localStorage.getItem("token") // Get the token from local storage

  if (token) {
    return true
  } else {
    return false
  }
}

export const useUserRole = () => {
  const role = localStorage.getItem("role"); // Get the role from local storage

  return role;
};
