import React from "react";
import* as Icons from '@radix-ui/react-icons';

export default function ProjectIcon({ icon, color }: { icon?: string | null, color?: string | null }) {
    const style = { color: color ?? '#71717a' };
    const iconComponent = (icon && Icons[`${icon}Icon` as keyof typeof Icons]) ?? Icons.CircleIcon;
    return <span className="text-lg flex-shrink-0 mt-0.5" style={style}>{React.createElement(iconComponent)}</span>;
}
