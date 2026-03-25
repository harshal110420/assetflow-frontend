import { useSelector } from "react-redux";

// Usage in any component:
// const { can, isAdmin } = usePermission();
// can('asset_master', 'new')   → true/false
// canView('maintenance')       → true/false

export function usePermission() {
  const { myPermissions, isAdmin, permissionsLoaded } = useSelector(
    (s) => s.permissions,
  );

  const can = (menuSlug, action) => {
    if (isAdmin) return true;
    if (!permissionsLoaded) return false;
    const menu = myPermissions[menuSlug];
    if (!menu) return false;
    return menu.actions[action] === true;
  };

  const canView = (menuSlug) => can(menuSlug, "view");

  return { can, canView, isAdmin, permissionsLoaded };
}
