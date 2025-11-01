//import React from 'react';
import { useSelector } from 'react-redux';

const ProfilePage = () => {
  const user = useSelector((state: any) => state.auth.user);

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Carregando Perfil...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Página em construção</h1>
    </div>
  );
};

export default ProfilePage;
