import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "admin_access_token";

/**
 * Set access token in cookies
 */
export const setToken = (token: string) => {
  Cookies.set(ACCESS_TOKEN_KEY, token, {
    expires: 1,           // 1 day
    secure: true,
    sameSite: "strict",
  });
};

/**
 * Get access token from cookies
 */
export const getToken = () => {
  return Cookies.get(ACCESS_TOKEN_KEY) || null;
};

/**
 * Remove access token (logout)
 */
export const removeToken = () => {
  Cookies.remove(ACCESS_TOKEN_KEY);
};
