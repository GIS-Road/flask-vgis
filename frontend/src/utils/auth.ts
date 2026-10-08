const token = 'is-admin'

export const getToken = () => {
  return localStorage.getItem('token')
}

export const removeToken = async () => {
  localStorage.removeItem('token')
}

export const setToken = async (token: string) => {
  localStorage.setItem('token', token)
}
