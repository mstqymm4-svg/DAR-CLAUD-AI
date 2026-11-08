import { useNavigate } from "react-router-dom";

/**
 * Mobile-only header with a large (44px) back button and safe-area-top padding.
 * Hidden on desktop (md:hidden).
 */
export default function MobileHeader({ title, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();else
    navigate(-1);
  };

  return (
    <div className="md:hidden safe-area-top -mt-2 mb-2">
      










      
    </div>);

}