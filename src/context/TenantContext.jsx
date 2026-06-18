import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(() => {
    return localStorage.getItem('agentos_tenant') || 'tenant_A';
  });

  useEffect(() => {
    localStorage.setItem('agentos_tenant', tenantId);
  }, [tenantId]);

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
