import React from 'react';
import { Alert, Button, Code, Stack, Title } from '@mantine/core';
import { IconAlertTriangle, IconReload } from '@tabler/icons-react';

interface RouteErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  info?: any;
}

export class RouteErrorBoundary extends React.Component<React.PropsWithChildren, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log detalhado no console para diagnóstico (pode integrar com serviço externo depois)
    if (import.meta.env.MODE !== 'production') {
      console.error('[RouteErrorBoundary] Caught error:', error, info);
    }
    this.setState({ info });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, info: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Stack p="lg">
          <Title order={3} fw={600}>
            <IconAlertTriangle style={{ verticalAlign: 'middle', marginRight: 8 }} /> Something went wrong
          </Title>
          <Alert color="red" variant="light" title="Runtime error" icon={<IconAlertTriangle size={18} />}> 
            <Stack gap={6}>
              <Code block>{this.state.error?.message || 'Unknown error'}</Code>
              {this.state.error?.stack && (
                <Code block style={{ maxHeight: 220, overflow: 'auto' }}>{this.state.error.stack}</Code>
              )}
              <Button leftSection={<IconReload size={16} />} onClick={this.reset} variant="light" size="xs" maw={160}>
                Retry render
              </Button>
            </Stack>
          </Alert>
        </Stack>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;
