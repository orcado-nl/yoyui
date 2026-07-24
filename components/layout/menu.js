import { classNames } from '@/components/lib/utils/Utils';
import { useRouter } from 'next/router';
import { memo, useEffect } from 'react';
import MenuData from './menu.json';
import MenuItem from './menuitem';

const Menu = memo((props) => {
    const router = useRouter();
    const menu = MenuData.data.map((data) => {
        const rootItem = { ...data };

        rootItem.expanded = rootItem.children?.some((item) => item.to === router.pathname || item.children?.some((it) => it.to === router.pathname));

        return rootItem;
    });

    const scrollToActiveItem = () => {
        const activeItem = document.querySelector('.router-link-active');

        if (activeItem) {
            activeItem.scrollIntoView({ block: 'center' });
        }
    };

    useEffect(() => {
        scrollToActiveItem();
    }, []);
    const sidebarClassName = classNames('layout-sidebar', { active: props.active });

    return (
        <aside className={sidebarClassName}>
            <nav>
                <ol className="layout-menu">
                    {menu.map((item, index) => (
                        <MenuItem menuItem={item} root={true} key={item?.id ?? item?.key ?? item?.name ?? item?.label ?? item?.value ?? item?.href ?? item?.src ?? item?.field ?? JSON.stringify(item)} />
                    ))}
                </ol>
            </nav>
        </aside>
    );
});

export default Menu;
