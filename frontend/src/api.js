import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://127.0.0.1:4000/api'});
api.interceptors.request.use(config=>{const token=localStorage.getItem('cv_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401){localStorage.removeItem('cv_token');localStorage.removeItem('cv_user');}return Promise.reject(e);});
