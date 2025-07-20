interface RiskAssessment {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'very-high';
  factors: RiskFactor[];
  recommendations: string[];
  diversificationScore: number;
  volatilityScore: number;
  liquidityScore: number;
}

interface RiskFactor {
  type: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  weight: number;
}

interface PortfolioItem {
  id: string;
  type: 'stock' | 'bond' | 'gold' | 'fund' | 'currency' | 'deposit';
  symbol: string;
  amount: number;
  currentValue: number;
  purchasePrice: number;
  purchaseDate: Date;
  sector?: string;
  country?: string;
  currency?: string;
}



class RiskAssessmentService {
  private readonly RISK_WEIGHTS = {
    concentration: 0.25,
    volatility: 0.20,
    liquidity: 0.15,
    correlation: 0.15,
    sector: 0.10,
    geography: 0.10,
    currency: 0.05
  };

  async assessPortfolioRisk(portfolio: PortfolioItem[]): Promise<RiskAssessment> {
    if (!portfolio.length) {
      return {
        score: 0,
        level: 'low',
        factors: [],
        recommendations: ['Portföyünüze yatırım ekleyerek başlayın'],
        diversificationScore: 0,
        volatilityScore: 0,
        liquidityScore: 0
      };
    }

    const factors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Concentration risk
    const concentrationRisk = this.calculateConcentrationRisk(portfolio);
    factors.push(concentrationRisk);
    totalRiskScore += concentrationRisk.weight * this.getRiskImpactScore(concentrationRisk.impact);

    // Volatility risk
    const volatilityRisk = await this.calculateVolatilityRisk(portfolio);
    factors.push(volatilityRisk);
    totalRiskScore += volatilityRisk.weight * this.getRiskImpactScore(volatilityRisk.impact);

    // Liquidity risk
    const liquidityRisk = this.calculateLiquidityRisk(portfolio);
    factors.push(liquidityRisk);
    totalRiskScore += liquidityRisk.weight * this.getRiskImpactScore(liquidityRisk.impact);

    // Correlation risk
    const correlationRisk = await this.calculateCorrelationRisk(portfolio);
    factors.push(correlationRisk);
    totalRiskScore += correlationRisk.weight * this.getRiskImpactScore(correlationRisk.impact);

    // Sector diversification
    const sectorRisk = this.calculateSectorRisk(portfolio);
    factors.push(sectorRisk);
    totalRiskScore += sectorRisk.weight * this.getRiskImpactScore(sectorRisk.impact);

    // Geographic diversification
    const geographicRisk = this.calculateGeographicRisk(portfolio);
    factors.push(geographicRisk);
    totalRiskScore += geographicRisk.weight * this.getRiskImpactScore(geographicRisk.impact);

    // Currency risk
    const currencyRisk = this.calculateCurrencyRisk(portfolio);
    factors.push(currencyRisk);
    totalRiskScore += currencyRisk.weight * this.getRiskImpactScore(currencyRisk.impact);

    const finalScore = Math.min(100, Math.max(0, totalRiskScore));
    const level = this.getRiskLevel(finalScore);
    const recommendations = this.generateRecommendations(factors);

    return {
      score: finalScore,
      level,
      factors,
      recommendations,
      diversificationScore: this.calculateDiversificationScore(portfolio),
      volatilityScore: volatilityRisk.weight * this.getRiskImpactScore(volatilityRisk.impact),
      liquidityScore: liquidityRisk.weight * this.getRiskImpactScore(liquidityRisk.impact)
    };
  }

  private calculateConcentrationRisk(portfolio: PortfolioItem[]): RiskFactor {
    const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
    const maxConcentration = Math.max(...portfolio.map(item => item.currentValue / totalValue));

    let impact: 'low' | 'medium' | 'high';
    let description: string;

    if (maxConcentration > 0.5) {
      impact = 'high';
      description = `Portföyünüzün %${(maxConcentration * 100).toFixed(1)}'i tek bir varlıkta yoğunlaşmış`;
    } else if (maxConcentration > 0.3) {
      impact = 'medium';
      description = `Portföyünüzün %${(maxConcentration * 100).toFixed(1)}'i tek bir varlıkta yoğunlaşmış`;
    } else {
      impact = 'low';
      description = 'Portföy konsantrasyonu kabul edilebilir seviyede';
    }

    return {
      type: 'concentration',
      impact,
      description,
      weight: this.RISK_WEIGHTS.concentration
    };
  }

  private async calculateVolatilityRisk(portfolio: PortfolioItem[]): Promise<RiskFactor> {
    // Simulated volatility calculation
    const volatilities = portfolio.map(item => this.getAssetVolatility(item));
    const avgVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;

    let impact: 'low' | 'medium' | 'high';
    let description: string;

    if (avgVolatility > 30) {
      impact = 'high';
      description = `Portföy volatilitesi yüksek (%${avgVolatility.toFixed(1)})`;
    } else if (avgVolatility > 15) {
      impact = 'medium';
      description = `Portföy volatilitesi orta seviyede (%${avgVolatility.toFixed(1)})`;
    } else {
      impact = 'low';
      description = `Portföy volatilitesi düşük (%${avgVolatility.toFixed(1)})`;
    }

    return {
      type: 'volatility',
      impact,
      description,
      weight: this.RISK_WEIGHTS.volatility
    };
  }

  private calculateLiquidityRisk(portfolio: PortfolioItem[]): RiskFactor {
    const liquidityScores = portfolio.map(item => this.getAssetLiquidity(item));
    const avgLiquidity = liquidityScores.reduce((sum, score) => sum + score, 0) / liquidityScores.length;

    let impact: 'low' | 'medium' | 'high';
    let description: string;

    if (avgLiquidity < 30) {
      impact = 'high';
      description = 'Portföyünüzde düşük likiditeye sahip varlıklar bulunuyor';
    } else if (avgLiquidity < 60) {
      impact = 'medium';
      description = 'Portföy likiditesi orta seviyede';
    } else {
      impact = 'low';
      description = 'Portföy likiditesi yeterli seviyede';
    }

    return {
      type: 'liquidity',
      impact,
      description,
      weight: this.RISK_WEIGHTS.liquidity
    };
  }

  private async calculateCorrelationRisk(portfolio: PortfolioItem[]): Promise<RiskFactor> {
    // Simplified correlation calculation
    const correlationMatrix = this.buildCorrelationMatrix(portfolio);
    const avgCorrelation = this.calculateAverageCorrelation(correlationMatrix);

    let impact: 'low' | 'medium' | 'high';
    let description: string;

    if (avgCorrelation > 0.7) {
      impact = 'high';
      description = 'Portföy varlıkları arasında yüksek korelasyon var';
    } else if (avgCorrelation > 0.4) {
      impact = 'medium';
      description = 'Portföy varlıkları arasında orta seviye korelasyon var';
    } else {
      impact = 'low';
      description = 'Portföy varlıkları arasında düşük korelasyon var';
    }

    return {
      type: 'correlation',
      impact,
      description,
      weight: this.RISK_WEIGHTS.correlation
    };
  }

  private calculateSectorRisk(portfolio: PortfolioItem[]): RiskFactor {
    const sectorDistribution = new Map<string, number>();
    const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);

    portfolio.forEach(item => {
      const sector = item.sector || 'other';
      const currentValue = sectorDistribution.get(sector) || 0;
      sectorDistribution.set(sector, currentValue + item.currentValue);
    });

    const maxSectorConcentration = Math.max(...Array.from(sectorDistribution.values())) / totalValue;
    const sectorCount = sectorDistribution.size;

    let impact: 'low' | 'medium' | 'high';
    let description: string;

    if (maxSectorConcentration > 0.6 || sectorCount < 3) {
      impact = 'high';
      description = 'Sektör diversifikasyonu yetersiz';
    } else if (maxSectorConcentration > 0.4 || sectorCount < 5) {
      impact = 'medium';
      description = 'Sektör diversifikasyonu orta seviyede';
    } else {
      impact = 'low';
      description = 'Sektör diversifikasyonu yeterli';
    }

    return {
      type: 'sector',
      impact,
      description,
      weight: this.RISK_WEIGHTS.sector
    };
  }

  private calculateGeographicRisk(portfolio: PortfolioItem[]): RiskFactor {
    const countryDistribution = new Map<string, number>();
    const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);

    portfolio.forEach(item => {
      const country = item.country || 'TR';
      const currentValue = countryDistribution.get(country) || 0;
      countryDistribution.set(country, currentValue + item.currentValue);
    });

    const maxCountryConcentration = Math.max(...Array.from(countryDistribution.values())) / totalValue;
    const countryCount = countryDistribution.size;

    let impact: 'low' | 'medium' | 'high';
    let description: string;

    if (maxCountryConcentration > 0.8 || countryCount < 2) {
      impact = 'high';
      description = 'Coğrafi diversifikasyon yetersiz';
    } else if (maxCountryConcentration > 0.6 || countryCount < 4) {
      impact = 'medium';
      description = 'Coğrafi diversifikasyon orta seviyede';
    } else {
      impact = 'low';
      description = 'Coğrafi diversifikasyon yeterli';
    }

    return {
      type: 'geography',
      impact,
      description,
      weight: this.RISK_WEIGHTS.geography
    };
  }

  private calculateCurrencyRisk(portfolio: PortfolioItem[]): RiskFactor {
    const currencyDistribution = new Map<string, number>();
    const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);

    portfolio.forEach(item => {
      const currency = item.currency || 'TRY';
      const currentValue = currencyDistribution.get(currency) || 0;
      currencyDistribution.set(currency, currentValue + item.currentValue);
    });

    const foreignCurrencyRatio = 1 - ((currencyDistribution.get('TRY') || 0) / totalValue);

    let impact: 'low' | 'medium' | 'high';
    let description: string;

    if (foreignCurrencyRatio > 0.7) {
      impact = 'high';
      description = 'Yabancı para riski yüksek';
    } else if (foreignCurrencyRatio > 0.4) {
      impact = 'medium';
      description = 'Yabancı para riski orta seviyede';
    } else {
      impact = 'low';
      description = 'Yabancı para riski düşük';
    }

    return {
      type: 'currency',
      impact,
      description,
      weight: this.RISK_WEIGHTS.currency
    };
  }

  private getAssetVolatility(item: PortfolioItem): number {
    // Simplified volatility based on asset type
    switch (item.type) {
      case 'stock':
        return 25;
      case 'fund':
        return 15;
      case 'gold':
        return 20;
      case 'currency':
        return 12;
      case 'deposit':
        return 2;
      default:
        return 10;
    }
  }

  private getAssetLiquidity(item: PortfolioItem): number {
    // Simplified liquidity score (0-100)
    switch (item.type) {
      case 'stock':
        return 80;
      case 'fund':
        return 70;
      case 'gold':
        return 60;
      case 'currency':
        return 90;
      case 'deposit':
        return 95;
      default:
        return 50;
    }
  }

  private buildCorrelationMatrix(portfolio: PortfolioItem[]): number[][] {
    const size = portfolio.length;
    const matrix: number[][] = Array(size).fill(null).map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = this.getAssetCorrelation(portfolio[i], portfolio[j]);
        }
      }
    }

    return matrix;
  }

  private getAssetCorrelation(asset1: PortfolioItem, asset2: PortfolioItem): number {
    // Simplified correlation based on asset types and sectors
    if (asset1.type === asset2.type) {
      if (asset1.sector === asset2.sector) {
        return 0.8;
      }
      return 0.6;
    }

    if ((asset1.type === 'stock' && asset2.type === 'fund') || 
        (asset1.type === 'fund' && asset2.type === 'stock')) {
      return 0.7;
    }

    if (asset1.type === 'gold' || asset2.type === 'gold') {
      return 0.2;
    }

    return 0.3;
  }

  private calculateAverageCorrelation(matrix: number[][]): number {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        sum += matrix[i][j];
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  private calculateDiversificationScore(portfolio: PortfolioItem[]): number {
    const typeDistribution = new Map<string, number>();
    const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);

    portfolio.forEach(item => {
      const currentValue = typeDistribution.get(item.type) || 0;
      typeDistribution.set(item.type, currentValue + item.currentValue);
    });

    // Calculate Herfindahl-Hirschman Index
    let hhi = 0;
    typeDistribution.forEach(value => {
      const share = value / totalValue;
      hhi += share * share;
    });

    // Convert to diversification score (0-100, higher is better)
    return Math.max(0, (1 - hhi) * 100);
  }

  private getRiskImpactScore(impact: 'low' | 'medium' | 'high'): number {
    switch (impact) {
      case 'low':
        return 20;
      case 'medium':
        return 50;
      case 'high':
        return 80;
      default:
        return 0;
    }
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'very-high' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'very-high';
  }

  private generateRecommendations(factors: RiskFactor[]): string[] {
    const recommendations: string[] = [];

    factors.forEach(factor => {
      if (factor.impact === 'high') {
        switch (factor.type) {
          case 'concentration':
            recommendations.push('Portföyünüzü daha fazla varlığa dağıtın');
            break;
          case 'volatility':
            recommendations.push('Daha düşük volatiliteli varlıklar ekleyin');
            break;
          case 'liquidity':
            recommendations.push('Daha likit varlıkların oranını artırın');
            break;
          case 'correlation':
            recommendations.push('Birbirleriyle düşük korelasyonlu varlıklar ekleyin');
            break;
          case 'sector':
            recommendations.push('Farklı sektörlerden varlıklar ekleyin');
            break;
          case 'geography':
            recommendations.push('Farklı ülkelerden varlıklar ekleyin');
            break;
          case 'currency':
            recommendations.push('Para birimi riskini azaltmak için TL varlıkları artırın');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Portföyünüz risk açısından dengeli görünüyor');
    }

    return recommendations;
  }

  async getMarketRiskIndicators(): Promise<{
    vix: number;
    bondYield: number;
    currencyVolatility: number;
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
  }> {
    // Simulated market data
    return {
      vix: 18.5,
      bondYield: 4.2,
      currencyVolatility: 12.3,
      marketSentiment: 'neutral'
    };
  }

  async calculateVaR(portfolio: PortfolioItem[], confidenceLevel: number = 0.95, timeHorizon: number = 1): Promise<{
    value: number;
    percentage: number;
    currency: string;
  }> {
    const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
    const portfolioVolatility = await this.calculatePortfolioVolatility(portfolio);
    
    // Simplified VaR calculation using normal distribution
    const zScore = confidenceLevel === 0.95 ? 1.645 : confidenceLevel === 0.99 ? 2.326 : 1.282;
    const varPercentage = zScore * portfolioVolatility * Math.sqrt(timeHorizon / 252);
    const varValue = totalValue * varPercentage;

    return {
      value: varValue,
      percentage: varPercentage * 100,
      currency: 'TRY'
    };
  }

  private async calculatePortfolioVolatility(portfolioItems: PortfolioItem[]): Promise<number> {
    const weights = portfolioItems.map(item => {
      const totalValue = portfolioItems.reduce((sum, p) => sum + p.currentValue, 0);
      return item.currentValue / totalValue;
    });

    const volatilities = portfolioItems.map(item => this.getAssetVolatility(item) / 100);
    
    // Simplified portfolio volatility calculation
    let portfolioVariance = 0;
    
    for (let i = 0; i < portfolioItems.length; i++) {
      portfolioVariance += weights[i] * weights[i] * volatilities[i] * volatilities[i];
      
      for (let j = i + 1; j < portfolioItems.length; j++) {
        const correlation = this.getAssetCorrelation(portfolioItems[i], portfolioItems[j]);
        portfolioVariance += 2 * weights[i] * weights[j] * volatilities[i] * volatilities[j] * correlation;
      }
    }

    return Math.sqrt(portfolioVariance);
  }
}

export const riskAssessmentService = new RiskAssessmentService();
export default riskAssessmentService;