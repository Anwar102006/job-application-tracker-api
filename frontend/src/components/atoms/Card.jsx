/**
 * Reusable Card Components (Phase 6.5A)
 */
export const Card = ({ children, hoverable = false, className = '', ...props }) => (
  <div className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, as: Component = 'h3', className = '', ...props }) => (
  <Component className={`card-title ${className}`.trim()} {...props}>
    {children}
  </Component>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`card-description ${className}`.trim()} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`.trim()} {...props}>
    {children}
  </div>
);
