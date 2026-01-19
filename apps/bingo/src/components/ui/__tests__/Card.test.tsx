import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Card, CardHeader, CardBody, CardFooter, CardTitle } from '../Card';

describe('Card', () => {
  it('renders children content', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  describe('header', () => {
    it('renders string header', () => {
      render(<Card header="Card Title">Content</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders custom header component', () => {
      render(
        <Card header={<span data-testid="custom-header">Custom Header</span>}>
          Content
        </Card>
      );
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('renders footer content', () => {
      render(<Card footer={<button>Save</button>}>Content</Card>);
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('padding variants', () => {
    it('applies md padding by default', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      // The content div should have p-6 class
      expect(card.innerHTML).toContain('p-6');
    });

    it('applies sm padding', () => {
      render(
        <Card padding="sm" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card.innerHTML).toContain('p-4');
    });

    it('applies lg padding', () => {
      render(
        <Card padding="lg" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card.innerHTML).toContain('p-8');
    });

    it('applies no padding when padding is none', () => {
      render(
        <Card padding="none" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      // Should not have padding classes
      expect(card.innerHTML).not.toContain('p-4');
      expect(card.innerHTML).not.toContain('p-6');
      expect(card.innerHTML).not.toContain('p-8');
    });
  });

  describe('variant styles', () => {
    it('applies default variant styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-background');
      expect(card.className).toContain('border-2');
    });

    it('applies outlined variant styles', () => {
      render(
        <Card variant="outlined" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-transparent');
      expect(card.className).toContain('border-2');
    });

    it('applies elevated variant styles', () => {
      render(
        <Card variant="elevated" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toContain('shadow-lg');
    });
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through additional props', () => {
    render(
      <Card data-testid="card" role="region" aria-label="Test card">
        Content
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'region');
    expect(card).toHaveAttribute('aria-label', 'Test card');
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies border and background styles', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header.className).toContain('border-b');
    expect(header.className).toContain('bg-muted/10');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>Header</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardBody', () => {
  it('renders children', () => {
    render(<CardBody>Body Content</CardBody>);
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('applies padding based on prop', () => {
    render(
      <CardBody padding="lg" data-testid="body">
        Body
      </CardBody>
    );
    expect(screen.getByTestId('body').className).toContain('p-8');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardBody ref={ref}>Body</CardBody>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('applies border and background styles', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('border-t');
    expect(footer.className).toContain('bg-muted/10');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>Footer</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle', () => {
  it('renders children', () => {
    render(<CardTitle>Card Title</CardTitle>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders as h3 element', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
  });

  it('applies text styles', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title.className).toContain('text-xl');
    expect(title.className).toContain('font-semibold');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<CardTitle ref={ref}>Title</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});
