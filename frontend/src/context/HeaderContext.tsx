import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface HeaderContextType {
    setHeaderItems: (items: ReactNode) => void;
    headerItems: ReactNode;
    setIsHeaderVisible: (visible: boolean) => void;
    isHeaderVisible: boolean;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [headerItems, setHeaderItems] = useState<ReactNode>(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    return (
        <HeaderContext.Provider value={{ setHeaderItems, headerItems, setIsHeaderVisible, isHeaderVisible }}>
            {children}
        </HeaderContext.Provider>
    );
};

export const useHeader = () => {
    const context = useContext(HeaderContext);
    if (!context) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
};

export const HeaderItems: React.FC<{ children: ReactNode; hidden?: boolean }> = ({ children, hidden = false }) => {
    const { setHeaderItems, setIsHeaderVisible } = useHeader();

    React.useEffect(() => {
        setHeaderItems(children);
        setIsHeaderVisible(!hidden);
        return () => {
            setHeaderItems(null);
            setIsHeaderVisible(true);
        };
    }, [children, setHeaderItems, setIsHeaderVisible, hidden]);

    return null;
};
